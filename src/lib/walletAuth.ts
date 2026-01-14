import { supabase } from '@/integrations/supabase/client'

const WALLET_AUTH_URL =
  'https://iagnculfrgjpkjlihvem.supabase.co/functions/v1/wallet-auth'

// IMPORTANT: Must match backend exactly
export const WALLET_SIGN_MESSAGE =
  'EduVerify login: Sign this message to verify wallet ownership' as const

const FRIENDLY_VERIFY_ERROR =
  'Wallet verification failed. Please reconnect your wallet and try again.'

interface VerifyResponse {
  success: boolean
  user: {
    id: string
    email: string
    wallet_address: string
  }
  token_hash: string
  verification_url: string
  is_new_user: boolean
}

interface CheckWalletResponse {
  exists: boolean
  onboarded: boolean
  role: string | null
}

function toFriendlyAuthError(): Error {
  return new Error(FRIENDLY_VERIFY_ERROR)
}

/* =========================
   CHECK WALLET (Keep for UI/Check Logic)
========================= */
export async function checkWalletExists(
  walletAddress: string
): Promise<CheckWalletResponse> {
  const response = await fetch(WALLET_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'check-wallet',
      wallet_address: walletAddress.toLowerCase(),
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to check wallet status')
  }

  return response.json()
}

/* =========================
   SIGN MESSAGE
========================= */
export async function signLoginMessage(
  connectedWalletAddress: string
): Promise<{
  signature: string
  message: typeof WALLET_SIGN_MESSAGE
  wallet_address: string
}> {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed')
  }

  const accounts = (await window.ethereum.request({
    method: 'eth_requestAccounts',
  })) as string[]

  const activeAddress = accounts?.[0]

  if (!activeAddress) {
    throw toFriendlyAuthError()
  }

  if (activeAddress.toLowerCase() !== connectedWalletAddress.toLowerCase()) {
    throw toFriendlyAuthError()
  }

  const signature = (await window.ethereum.request({
    method: 'personal_sign',
    params: [WALLET_SIGN_MESSAGE, activeAddress],
  })) as string

  return {
    signature,
    message: WALLET_SIGN_MESSAGE,
    wallet_address: activeAddress,
  }
}

/* =========================
   VERIFY SIGNATURE
========================= */
export async function verifySignature(
  payload: {
    wallet_address: string
    signature: string
    message: typeof WALLET_SIGN_MESSAGE
  },
  mode: 'signup' | 'login' = 'login'
): Promise<VerifyResponse> {
  const response = await fetch(WALLET_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'verify',
      ...payload,
      mode,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))

    if (errorData.code === 'USER_NOT_FOUND') {
      throw new Error('No account found with this wallet. Please sign up first.')
    }

    if (errorData.code === 'USER_EXISTS') {
      throw new Error(
        'An account already exists with this wallet. Please log in instead.'
      )
    }

    throw new Error(errorData.error || FRIENDLY_VERIFY_ERROR)
  }

  return response.json()
}

/* =========================
   SIGNUP FLOW
========================= */
export async function signUpWithWallet(
  connectedWalletAddress: string
): Promise<{
  user: any
  session: boolean
  isNewUser: boolean
}> {
  const { data } = await supabase.auth.getSession()
  if (data.session?.user) {
    return {
      user: data.session.user,
      session: true,
      isNewUser: false,
    }
  }

  const normalizedAddress = connectedWalletAddress.toLowerCase()
  const signed = await signLoginMessage(normalizedAddress)

  const verifyResult = await verifySignature(
    {
      wallet_address: signed.wallet_address,
      signature: signed.signature,
      message: signed.message,
    },
    'signup'
  )

  const { error } = await supabase.auth.verifyOtp({
    token_hash: verifyResult.token_hash,
    type: 'magiclink',
  })

  if (error) {
    throw toFriendlyAuthError()
  }

  return {
    user: verifyResult.user,
    session: true,
    isNewUser: verifyResult.is_new_user,
  }
}

/* =========================
   LOGIN FLOW (🔒 FIXED: TRUST VERIFY RESULT)
========================= */
export async function loginWithWallet(
  connectedWalletAddress: string
): Promise<{
  user: any
  session: boolean
}> {
  const normalizedAddress = connectedWalletAddress.toLowerCase()

  // 🔧 Normalize address BEFORE signing message
  const signed = await signLoginMessage(normalizedAddress)

  // ✅ TRUST: verifySignature will throw 'USER_NOT_FOUND' if the wallet isn't in DB
  const verifyResult = await verifySignature(
    {
      wallet_address: signed.wallet_address,
      signature: signed.signature,
      message: signed.message,
    },
    'login'
  )

  const { error } = await supabase.auth.verifyOtp({
    token_hash: verifyResult.token_hash,
    type: 'magiclink',
  })

  if (error) {
    throw new Error('Login failed. Please try again.')
  }

  return {
    user: verifyResult.user,
    session: true,
  }
}

/* =========================
   SIGN OUT
========================= */
export async function signOutWallet(): Promise<void> {
  await supabase.auth.signOut()
}

/* =========================
   GET AUTH WALLET (🔒 FIXED)
========================= */
export async function getAuthenticatedWallet(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('wallet_address')
    .eq('user_id', user.id)
    .maybeSingle() 

  if (error) return null

  return data?.wallet_address ?? null
}
