import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
    const { code, redirectUri } = await request.json()

    const LINE_CLIENT_ID = process.env.NEXT_PUBLIC_LINE_CLIENT_ID
    const LINE_CLIENT_SECRET = process.env.LINE_CLIENT_SECRET
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('LINE Auth API called with code:', code?.substring(0, 10) + '...')

    try {
        // 1. Get LINE Access Token
        const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                client_id: LINE_CLIENT_ID,
                client_secret: LINE_CLIENT_SECRET,
            }),
        })
        const tokens = await tokenResponse.json()
        console.log('LINE token response:', tokens.error || 'success')

        if (!tokens.access_token) {
            throw new Error('Failed to get access token: ' + JSON.stringify(tokens))
        }

        // 2. Get User Profile
        const profileResponse = await fetch('https://api.line.me/v2/profile', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        })
        const profile = await profileResponse.json()
        console.log('LINE profile:', profile.displayName)

        if (!profile.userId) {
            throw new Error('Failed to get profile')
        }

        // 3. Supabase Integration
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        const dummyEmail = `${profile.userId}@line.hourensou.app`

        // Check/Create user
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
        let user = users.find(u => u.email === dummyEmail)
        console.log('Existing user found:', !!user)

        if (!user) {
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: dummyEmail,
                email_confirm: true,
                user_metadata: { name: profile.displayName, avatar_url: profile.pictureUrl }
            })
            if (createError) {
                console.error('Create user error:', createError)
                throw createError
            }
            user = newUser.user
            console.log('New user created:', user.id)
        } else {
            await supabaseAdmin.auth.admin.updateUserById(user.id, {
                user_metadata: { name: profile.displayName, avatar_url: profile.pictureUrl }
            })
            console.log('User metadata updated')
        }

        // 4. Generate Session Link - redirect to /auth/callback to handle the tokens
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://horenso.hitokoto.tech'
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
