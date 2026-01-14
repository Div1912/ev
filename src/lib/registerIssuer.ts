import { supabase } from "@/integrations/supabase/client"

const SUPABASE_FUNCTION_NAME = "register-issuer"

interface RegisterIssuerResponse {
  success: boolean
  message?: string
  transaction_hash?: string
  block_number?: number
  already_registered?: boolean
  error?: string
}

/**
 * Register an issuer on the blockchain via Supabase Edge Function.
 * Uses the contract owner's key server-side to authorize this issuer address.
 */
export async function registerIssuerOnBlockchain(
  walletAddress: string,
  institutionId: string,
): Promise<RegisterIssuerResponse> {
  // Ensure caller is authenticated (functions.invoke will pass JWT automatically)
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !sessionData.session) {
    throw new Error("Not authenticated. Please sign in first.")
  }

  const { data, error } = await supabase.functions.invoke(SUPABASE_FUNCTION_NAME, {
    body: {
      wallet_address: walletAddress,
      institution_id: institutionId,
    },
  })

  if (error) {
    throw new Error(error.message || "Failed to register issuer")
  }

  return data as RegisterIssuerResponse
}
