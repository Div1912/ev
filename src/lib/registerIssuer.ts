import { supabase } from "@/integrations/supabase/client"

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://ebwxwrqcnbgpgzavrfpj.supabase.co"

interface RegisterIssuerResponse {
  success: boolean
  message?: string
  transaction_hash?: string
  block_number?: number
  already_registered?: boolean
  error?: string
}

/**
 * Register an issuer on the blockchain via Supabase Edge Function
 * This function calls the backend which uses the contract owner's wallet
 * to authorize the new issuer on the smart contract.
 */
export async function registerIssuerOnBlockchain(
  walletAddress: string,
  institutionName: string,
): Promise<RegisterIssuerResponse> {
  try {
    // Get the current session for authentication
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !sessionData.session) {
      throw new Error("Not authenticated. Please sign in first.")
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/register-issuer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
      body: JSON.stringify({
        wallet_address: walletAddress,
        institution_name: institutionName,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Failed to register issuer")
    }

    return data
  } catch (error) {
    console.error("Register issuer error:", error)
    throw error
  }
}
