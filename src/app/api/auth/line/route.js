import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * 決定論的パスワード生成 (Edge Runtime互換)
 */
function generatePassword(userId, secret) {
    let hash = 5381
    const str = userId + secret
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i)
        hash = hash & 0x7fffffff
    }
    return `L${hash.toString(36)}${(hash * 31).toString(36)}X`.substring(0, 32)
}

export async function POST(request) {
    try {
        const { code } = await request.json()

        const LINE_CLIENT_ID = process.env.NEXT_PUBLIC_LINE_CLIENT_ID
        const LINE_CLIENT_SECRET = process.env.LINE_CLIENT_SECRET
        const LINE_AUTH_SECRET = process.env.LINE_AUTH_SECRET || 'hourensou-final-secret-2024'
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
        const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://horenso.hitokoto.tech'

        if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing')

        // 1. LINE Access Token
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
        if (!tokens.access_token) throw new Error(`LINE Token Error: ${tokens.error_description || 'Failed'}`)

        // 2. LINE Profile
        const profileRes = await fetch('https://api.line.me/v2/profile', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        })
        const profile = await profileRes.json()
        if (!profile.userId) throw new Error('Failed to get LINE profile')

        const email = `${profile.userId.toLowerCase()}@line.hourensou.app`
        const password = generatePassword(profile.userId, LINE_AUTH_SECRET)
        const metadata = { name: profile.displayName, avatar_url: profile.pictureUrl, line_user_id: profile.userId }

        // 3. 認証の不壊(フェイルセーフ)ロジック
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        console.log(`[Auth] Syncing user: ${email}`)

        // ユーザーを確実に取得または作成し、さらにパスワードを現在のロジックのものに強制同期する
        const { data: usersData } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
        const existingUser = usersData?.users?.find(u => u.email.toLowerCase() === email)

        if (existingUser) {
            console.log('[Auth] User exists. Force syncing password and metadata...')
            const { error: updateError } = await adminClient.auth.admin.updateUserById(existingUser.id, {
                password: password,
                user_metadata: metadata,
                email_confirm: true
            })
            if (updateError) throw new Error(`Update Error: ${updateError.message}`)
        } else {
            console.log('[Auth] Creating new confirmed user...')
            const { error: createError } = await adminClient.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: metadata
            })
            if (createError) throw new Error(`Create Error: ${createError.message}`)
        }

        // 4. サインイン (パスワード同期済みなので必ず成功する)
        console.log('[Auth] Final sign-in...')
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (signInError || !signInData.session) {
            throw new Error(`Sign-in Error: ${signInError?.message || 'No session returned'}`)
        }

        // 5. プロフィール同期 (バックグラウンド)
        adminClient.from('profiles').upsert({
            id: signInData.user.id,
            username: profile.displayName,
            avatar_url: profile.pictureUrl,
            updated_at: new Date().toISOString()
        }).then(({ error }) => {
            if (error) console.warn('[Auth] Profiles table sync skipped:', error.message)
        })

        return NextResponse.json({
            success: true,
            session: {
                access_token: signInData.session.access_token,
                refresh_token: signInData.session.refresh_token,
                expires_at: signInData.session.expires_at
            }
        })

    } catch (err) {
        console.error('[Auth Error Full]', err)
        return NextResponse.json({
            error: '認証に失敗しました',
            details: err.message
        }, { status: 500 })
    }
}
