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
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            console.error('Missing Supabase credentials', {
                hasUrl: !!SUPABASE_URL,
                hasKey: !!SUPABASE_SERVICE_ROLE_KEY
            })
            throw new Error('Server configuration error: Missing Supabase credentials')
        }

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

        console.log('Looking for user with email:', email)

        let userId = null

        // Simply try to create the user first - this is the most reliable approach
        const createResult = await supabase.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: metadata
        })

        console.log('Create user result:', {
            success: !createResult.error,
            error: createResult.error?.message,
            userId: createResult.data?.user?.id
        })

        if (createResult.error) {
            // User probably exists - try to find and update them
            if (createResult.error.message?.includes('already') ||
                createResult.error.message?.includes('exists') ||
                createResult.error.message?.includes('registered')) {

                console.log('User exists, searching...')

                // Get all users to find this one
                const { data: allUsers, error: listError } = await supabase.auth.admin.listUsers({
                    perPage: 1000
                })

                if (listError) {
                    console.error('List users error:', listError)
                    throw new Error('Failed to list users: ' + listError.message)
                }

                console.log('Total users found:', allUsers?.users?.length || 0)

                const existingUser = allUsers?.users?.find(u => u.email === email)

                if (existingUser) {
                    console.log('Found existing user:', existingUser.id)
                    userId = existingUser.id

                    // Update their metadata
                    const updateResult = await supabase.auth.admin.updateUserById(existingUser.id, {
                        user_metadata: metadata
                    })
                    if (updateResult.error) {
                        console.error('Update user error:', updateResult.error)
                    }
                } else {
                    console.error('User reported as existing but not found in list')
                    console.error('Looking for email:', email)
                    console.error('Available emails:', allUsers?.users?.map(u => u.email).join(', '))
                    throw new Error('Failed to create or find user - user exists but not found')
                }
            } else {
                console.error('Unexpected create user error:', createResult.error)
                throw new Error('User creation failed: ' + createResult.error.message)
            }
        } else {
            // New user created successfully
            userId = createResult.data.user.id
            console.log('New user created:', userId)
        }

        console.log('Proceeding with user ID:', userId)

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
