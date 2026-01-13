import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"
import { ethers } from "https://esm.sh/ethers@6.13.4"
import { Deno } from "https://deno.land/std@0.191.0/runtime.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// Contract ABI - only the functions we need
const CONTRACT_ABI = [
  "function addIssuer(address issuer, string memory institutionId) external",
  "function isAuthorizedIssuer(address issuer) external view returns (bool)",
  "function getIssuerInfo(address issuer) external view returns (string memory institutionId, bool isActive)",
]

// Contract address - your deployed contract
const CONTRACT_ADDRESS = "0x0243fc35Ace74639Bf847FE69B804DD03057E4Ba"

// Flow EVM Testnet RPC
const RPC_URL = "https://testnet.evm.nodes.onflow.org"

interface RegisterIssuerRequest {
  wallet_address: string
  institution_name: string
}

// Validate Ethereum address format
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  try {
    // Get the contract owner's private key from environment
    const ownerPrivateKey = Deno.env.get("CONTRACT_OWNER_PRIVATE_KEY")
    if (!ownerPrivateKey) {
      console.error("CONTRACT_OWNER_PRIVATE_KEY not configured")
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Verify the request is authenticated
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get auth token from request
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Verify the user
    const token = authHeader.replace("Bearer ", "")
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Parse request body
    const body: RegisterIssuerRequest = await req.json()
    const { wallet_address, institution_name } = body

    // Validate inputs
    if (!wallet_address || !isValidAddress(wallet_address)) {
      return new Response(JSON.stringify({ error: "Invalid wallet address" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (!institution_name || institution_name.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Institution name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const normalizedAddress = wallet_address.toLowerCase()

    // Connect to blockchain with owner's wallet
    const provider = new ethers.JsonRpcProvider(RPC_URL)
    const ownerWallet = new ethers.Wallet(ownerPrivateKey, provider)
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, ownerWallet)

    // Check if issuer is already registered
    try {
      const isAuthorized = await contract.isAuthorizedIssuer(normalizedAddress)
      if (isAuthorized) {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Issuer already registered",
            already_registered: true,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        )
      }
    } catch (checkError) {
      console.log("Could not check existing registration, proceeding with registration")
    }

    // Register the issuer on blockchain
    console.log(`Registering issuer ${normalizedAddress} for institution ${institution_name}`)

    const tx = await contract.addIssuer(normalizedAddress, institution_name.trim())
    console.log(`Transaction sent: ${tx.hash}`)

    // Wait for confirmation
    const receipt = await tx.wait()
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`)

    // Log the registration in the database for tracking
    await supabase
      .from("issuer_registrations")
      .insert({
        user_id: userData.user.id,
        wallet_address: normalizedAddress,
        institution_name: institution_name.trim(),
        transaction_hash: tx.hash,
        block_number: receipt.blockNumber,
        registered_at: new Date().toISOString(),
      })
      .catch((err) => {
        // Don't fail if logging fails - the blockchain registration succeeded
        console.error("Failed to log registration:", err)
      })

    return new Response(
      JSON.stringify({
        success: true,
        message: "Issuer registered successfully",
        transaction_hash: tx.hash,
        block_number: receipt.blockNumber,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Register issuer error:", error)

    // Check if it's a contract revert error
    if (error.code === "CALL_EXCEPTION" || error.message?.includes("revert")) {
      return new Response(
        JSON.stringify({
          error: "Blockchain registration failed. The contract may have rejected the transaction.",
          details: error.reason || error.message,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
