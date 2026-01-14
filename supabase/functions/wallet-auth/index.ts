import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { ethers } from 'https://esm.sh/ethers@6.13.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// IMPORTANT: Must match frontend
const SIGN_MESSAGE =
  'EduVerify login: Sign this message to verify wallet ownership'

const FRIENDLY_VERIFY_ERROR =
  'Wallet verification failed. Please reconnect your wallet and try again.'

interface VerifyRequest {
  wallet_address: string
  signature: string
  message: string
  mode?: 'signup' | 'login'
}

// Validate Ethereum address
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ✅ FIX: route using BODY, not URL
    const body = await req.json()
    const action = body.action

    if (!action) {
      return new Response(JSON.stringify({ error: 'Action is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    /* =========================
       NONCE / MESSAGE
    ========================= */
    if (action === 'nonce') {
      const { wallet_address } = body

      if (!wallet_address || !isValidAddress(wallet_address)) {
        return new Response(JSON.stringify({ error: 'Invalid wallet address' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ message: SIGN_MESSAGE }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    /* =========================
       CHECK WALLET
    ========================= */
    if (action === 'check-wallet') {
      const { wallet_address } = body

      if (!wallet_address || !isValidAddress(wallet_address)) {
        return new Response(JSON.stringify({ error: 'Invalid wallet address' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const normalizedAddress = wallet_address.toLowerCase()

      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, role, onboarded')
        .ilike('wallet_address', normalizedAddress)
        .maybeSingle()

      if (error) {
        console.error('Failed to lookup profile:', error)
        return new Response(JSON.stringify({ error: 'Failed to check wallet' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(
        JSON.stringify({
          exists: !!data?.user_id,
          onboarded: data?.onboarded ?? false,
          role: data?.role ?? null,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    /* =========================
       VERIFY SIGNATURE
    ========================= */
    if (action === 'verify') {
      const { wallet_address, signature, message, mode = 'login' } =
        body as VerifyRequest

      if (
        !wallet_address ||
        !isValidAddress(wallet_address) ||
        !signature ||
        !message
      ) {
        return new Response(JSON.stringify({ error: FRIENDLY_VERIFY_ERROR }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (message !== SIGN_MESSAGE) {
        return new Response(JSON.stringify({ error: FRIENDLY_VERIFY_ERROR }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const normalizedAddress = wallet_address.toLowerCase()

      let recoveredAddress: string
      try {
        recoveredAddress = ethers.verifyMessage(message, signature).toLowerCase()
      } catch (err) {
        console.error('Signature verification failed:', err)
        return new Response(JSON.stringify({ error: FRIENDLY_VERIFY_ERROR }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (recoveredAddress !== normalizedAddress) {
        return new Response(JSON.stringify({ error: FRIENDLY_VERIFY_ERROR }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const email = `${normalizedAddress}@wallet.eduverify.local`

       const { data: existingProfile, error: profileError } = await supabase
         .from('profiles')
         .select('id, user_id, role, onboarded')
         .ilike('wallet_address', normalizedAddress)
         .maybeSingle()

      if (profileError) {
        console.error('Failed to lookup profile:', profileError)
        return new Response(JSON.stringify({ error: 'Failed to verify wallet' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      let userId = ''
      let userEmail = email
      let isNewUser = false

      // LOGIN
      if (mode === 'login') {
        if (!existingProfile?.user_id) {
          return new Response(
            JSON.stringify({
              error: 'No account found with this wallet. Please sign up first.',
              code: 'USER_NOT_FOUND',
            }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        userId = existingProfile.user_id
        const { data: userData, error: userError } =
          await supabase.auth.admin.getUserById(userId)

        if (userError || !userData?.user) {
          console.error('Failed to fetch user:', userError)
          return new Response(JSON.stringify({ error: 'Failed to verify wallet' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        userEmail = userData.user.email ?? email
      }

      // SIGNUP
      else if (mode === 'signup') {
        if (existingProfile?.user_id) {
          return new Response(
            JSON.stringify({
              error: 'An account already exists with this wallet. Please log in instead.',
              code: 'USER_EXISTS',
            }),
            {
              status: 409,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }

        const { data: newUser, error: createError } =
          await supabase.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: { wallet_address: normalizedAddress },
          })

        if (createError || !newUser?.user) {
          console.error('Failed to create user:', createError)
          return new Response(JSON.stringify({ error: 'Failed to create user account' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        userId = newUser.user.id
        userEmail = newUser.user.email ?? email
        isNewUser = true

        await supabase.from('profiles').insert({
          user_id: userId,
          wallet_address: normalizedAddress,
          role: 'pending',
          onboarded: false,
        })
      } else {
        return new Response(JSON.stringify({ error: 'Invalid mode' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: linkData, error: linkError } =
        await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: userEmail,
        })

      if (linkError || !linkData) {
        console.error('Failed to generate auth link:', linkError)
        return new Response(JSON.stringify({ error: 'Failed to create session' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: userId,
            email: userEmail,
            wallet_address: normalizedAddress,
          },
          token_hash: linkData.properties.hashed_token,
          verification_url: linkData.properties.action_link,
          is_new_user: isNewUser,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Wallet auth error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
