import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { ethers } from "https://esm.sh/ethers@6.13.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Contract ABI - only what we need
const CONTRACT_ABI = [
  "function addIssuer(address issuerAddress, string institutionId) external",
  "function isAuthorizedIssuer(address issuerAddress) external view returns (bool)",
  "function getIssuerInfo(address issuerAddress) external view returns (tuple(address issuerAddress, string institutionId, bool authorized))",
];

const CONTRACT_ADDRESS = "0x0243fc35Ace74639Bf847FE69B804DD03057E4Ba";
const RPC_URL = "https://testnet.evm.nodes.onflow.org";

interface RegisterIssuerRequest {
  wallet_address: string;
  institution_id: string;
}

function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const ownerPrivateKey = Deno.env.get("CONTRACT_OWNER_PRIVATE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!ownerPrivateKey || !supabaseUrl || !supabaseServiceKey) {
      console.error("Missing required env vars", {
        hasOwnerKey: !!ownerPrivateKey,
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
      });
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Partial<RegisterIssuerRequest>;
    const wallet_address = body.wallet_address;
    const institution_id = body.institution_id;

    if (!wallet_address || !isValidAddress(wallet_address)) {
      return new Response(JSON.stringify({ error: "Invalid wallet address" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!institution_id || institution_id.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Institution ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedAddress = wallet_address.toLowerCase();
    const normalizedInstitutionId = institution_id.trim();

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const ownerWallet = new ethers.Wallet(ownerPrivateKey, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, ownerWallet);

    const alreadyAuthorized = (await contract.isAuthorizedIssuer(normalizedAddress)) as boolean;
    if (alreadyAuthorized) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Issuer already authorized",
          already_registered: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const tx = await contract.addIssuer(normalizedAddress, normalizedInstitutionId);
    const receipt = await tx.wait();

    // Log for observability only (do not fail if this write fails)
    const { error: logError } = await supabase.from("issuer_registrations").insert({
      user_id: userData.user.id,
      wallet_address: normalizedAddress,
      institution_name: normalizedInstitutionId,
      transaction_hash: tx.hash,
      block_number: Number(receipt?.blockNumber ?? 0) || null,
      registered_at: new Date().toISOString(),
    });

    if (logError) {
      console.error("Failed to log issuer registration:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Issuer authorized on blockchain",
        transaction_hash: tx.hash,
        block_number: Number(receipt?.blockNumber ?? 0) || null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    console.error("register-issuer error:", err);

    const e = err as { code?: string; message?: string; reason?: string };

    if (e?.code === "CALL_EXCEPTION" || e?.message?.includes("revert")) {
      return new Response(
        JSON.stringify({
          error: "Blockchain authorization failed",
          details: e?.reason || e?.message || "Contract reverted",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
