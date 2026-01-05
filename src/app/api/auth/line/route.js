import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * 決定論的パスワード生成関数
 */
function generatePassword(userId, secret) {
    let hash = 5381
    const str = userId + secret
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i)
        hash = hash & 0x7fffffff
    }
    const base = hash.toString(36)
    const suffix = (hash * 31).toString(36)
    return `L${base}${suffix}X`.substring(0, 32)
}

/**
 * LINEログイン API Route (最終修正版)
 */
export async function POST(request) {
    try {
        const { code } = await request.json()

        const LINE_CLIENT_ID = process.env.NEXT_PUBLIC_LINE_CLIENT_ID
        const LINE_CLIENT_SECRET = process.env.LINE_CLIENT_SECRET
        const LINE_AUTH_SECRET = process.env.LINE_AUTH_SECRET || 'hourensou-secret-2024-v3'
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
        const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://horenso.hitokoto.tech'

        if (!LINE_CLIENT_ID || !LINE_CLIENT_SECRET || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
            throw new Error('Environment variables are not configured correctly')
        }

        // 1. LINE Authorization Code を Access Token に交換
        console.log('[Auth] Exchanging LINE code...')
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

        // 2. LINE プロフィールの取得
        const profileRes = await fetch('https://api.line.me/v2/profile', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        })
        const profile = await profileRes.json()
        if (!profile.userId) throw new Error('LINE Profile Error: Failed to get user profile')

        const email = `${profile.userId}@line.hourensou.app`
        const password = generatePassword(profile.userId, LINE_AUTH_SECRET)
        const metadata = {
            name: profile.displayName,
            avatar_url: profile.pictureUrl,
            line_user_id: profile.userId
        }

        // 3. Supabase クライアントの準備 (管理者用)
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        const adminClient = SUPABASE_SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null

        // 4. サインインを試行
        console.log(`[Auth] Attempting sign-in for ${email}`)
        let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        // 5. ユーザーが存在しない場合、管理者権限で「確認済み」ユーザーを作成
        if (signInError) {
            console.log('[Auth] Sign-in failed (user may not exist), creating user via admin...')
            if (!adminClient) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for first-time user creation')

            const { data: adminUser, error: adminError } = await adminClient.auth.admin.createUser({
                email,
                password,
                email_confirm: true, // 重要: メール確認をスキップ
                user_metadata: metadata
            })

            if (adminError) {
                // 既に存在しているがログインに失敗したケース
                if (adminError.message.includes('already exists') || adminError.message.includes('registered')) {
                    console.log('[Auth] User already exists, retrying sign-in...')
                } else {
                    throw new Error(`Admin Create Error: ${adminError.message}`)
                }
            }

            // 作成または確認後、再度サインイン
            console.log('[Auth] Final sign-in attempt...')
            const retry = await supabase.auth.signInWithPassword({ email, password })
            if (retry.error) throw new Error(`Final Sign-in Error: ${retry.error.message}`)
            signInData = retry.data
        }

        if (!signInData?.session) throw new Error('Authentication succeeded but Supabase returned no session')

        // 6. プロフィール情報の非同期更新 (失敗してもログインは継続)
        if (signInData.user && adminClient) {
            adminClient.auth.admin.updateUserById(signInData.user.id, { user_metadata: metadata })
                .then(() => adminClient.from('profiles').upsert({
                    id: signInData.user.id,
                    username: profile.displayName,
                    avatar_url: profile.pictureUrl,
                    updated_at: new Date().toISOString()
                }))
                .catch(e => console.warn('[Auth] Profile sync failed:', e.message))
        }

        console.log('[Auth] Login successful')
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
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }, { status: 500 })
    }
}
