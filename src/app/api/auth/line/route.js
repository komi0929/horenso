import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
    const { code } = await request.json()

    const LINE_CLIENT_ID = process.env.NEXT_PUBLIC_LINE_CLIENT_ID
    const LINE_CLIENT_SECRET = process.env.LINE_CLIENT_SECRET
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://horenso.hitokoto.tech'

    try {
        // 1. Get LINE Access Token
        const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
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
        const tokens = await tokenRes.json()
        if (!tokens.access_token) throw new Error('LINE token error: ' + JSON.stringify(tokens))

        // 2. Get LINE Profile
        const profileRes = await fetch('https://api.line.me/v2/profile', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        })
        const profile = await profileRes.json()
        if (!profile.userId) throw new Error('LINE profile error')

        // 3. Supabase - Create or get user
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })
        const email = `${profile.userId}@line.hourensou.app`
        const metadata = {
            name: profile.displayName,
            avatar_url: profile.pictureUrl,
            line_user_id: profile.userId
        }

        let userId = null

        // First, try to find existing user by email using listUsers with filter
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers({
            page: 1,
            perPage: 1
        })

        // Search for existing user with this email
        let existingUser = null
        if (existingUsers?.users) {
            for (const user of existingUsers.users) {
                if (user.email === email) {
                    existingUser = user
                    break
                }
            }
        }

        // If we need to search more pages, do pagination
        if (!existingUser && existingUsers?.users?.length === 1) {
            // Try broader search
            const { data: allUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 })
            existingUser = allUsers?.users?.find(u => u.email === email)
        }

        if (existingUser) {
            // User exists - update metadata
            console.log('Existing user found:', existingUser.id)
            await supabase.auth.admin.updateUserById(existingUser.id, {
                user_metadata: metadata
            })
            userId = existingUser.id
        } else {
            // Create new user
            const createResult = await supabase.auth.admin.createUser({
                email,
                email_confirm: true,
                user_metadata: metadata
            })

            if (createResult.error) {
                // Double check if it's "already registered" error
                if (createResult.error.message?.includes('already been registered') ||
                    createResult.error.message?.includes('already exists')) {
                    // Race condition - user was created between our check and create
                    const { data: retryUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 })
                    const retryUser = retryUsers?.users?.find(u => u.email === email)
                    if (retryUser) {
                        userId = retryUser.id
                        await supabase.auth.admin.updateUserById(retryUser.id, {
                            user_metadata: metadata
                        })
                    } else {
                        console.error('Failed to find user after creation reported as duplicate')
                        throw new Error('Failed to create or find user')
                    }
                } else {
                    console.error('User creation error:', createResult.error)
                    throw new Error('User creation failed: ' + createResult.error.message)
                }
            } else {
                userId = createResult.data.user.id
                console.log('New user created:', userId)
            }
        }

        console.log('Using user ID for magic link:', userId)

        // 4. Generate magic link (always works for existing users)
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email,
            options: { redirectTo: `${siteUrl}/auth/callback` }
        })
        if (linkError) throw new Error('Magic link error: ' + linkError.message)

        return NextResponse.json({ session_link: linkData.properties.action_link })
    } catch (err) {
        console.error('LINE Auth Error:', err.message)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
