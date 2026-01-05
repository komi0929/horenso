import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
    const { code, redirectUri } = await request.json()

    const LINE_CLIENT_ID = process.env.NEXT_PUBLIC_LINE_CLIENT_ID
    const LINE_CLIENT_SECRET = process.env.LINE_CLIENT_SECRET
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://horenso.hitokoto.tech'

    console.log('LINE Auth API called')

    try {
        // 1. Get LINE Access Token
        const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: `${siteUrl}/auth/callback/line`,
                client_id: LINE_CLIENT_ID,
                client_secret: LINE_CLIENT_SECRET,
            }),
        })
        const tokens = await tokenResponse.json()

        if (!tokens.access_token) {
            throw new Error('Failed to get access token: ' + JSON.stringify(tokens))
        }

        // 2. Get User Profile
        const profileResponse = await fetch('https://api.line.me/v2/profile', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        })
        const profile = await profileResponse.json()

        if (!profile.userId) {
            throw new Error('Failed to get profile')
        }

        console.log('LINE profile:', profile.displayName)

        // 3. Supabase Integration
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        const dummyEmail = `${profile.userId}@line.hourensou.app`

        // Try to create user, handle if already exists
        let user = null

        try {
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: dummyEmail,
                email_confirm: true,
                user_metadata: { name: profile.displayName, avatar_url: profile.pictureUrl }
            })

            if (createError) {
                // User probably already exists, try to find them
                if (createError.message.includes('already been registered')) {
                    console.log('User already exists, fetching...')
                    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
                    user = users.find(u => u.email === dummyEmail)

                    if (user) {
                        // Update metadata
                        await supabaseAdmin.auth.admin.updateUserById(user.id, {
                            user_metadata: { name: profile.displayName, avatar_url: profile.pictureUrl }
                        })
                    }
                } else {
                    throw createError
                }
            } else {
                user = newUser.user
                console.log('New user created:', user.id)
            }
        } catch (err) {
            console.error('User creation/fetch error:', err)
            throw err
        }

        if (!user) {
            throw new Error('Failed to create or find user')
        }

        // 4. Generate Magic Link
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: dummyEmail,
            options: { redirectTo: `${siteUrl}/auth/callback` }
        })

        if (linkError) {
            console.error('Generate link error:', linkError)
            throw linkError
        }

        console.log('Magic link generated successfully')
        return NextResponse.json({ session_link: linkData.properties.action_link })
    } catch (err) {
        console.error("LINE Auth API Error:", err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
