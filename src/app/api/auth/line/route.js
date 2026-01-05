import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * 決定論的パスワード生成関数
 * (外部ライブラリ依存なし - Edge Runtime互換)
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
 * LINEログイン API Route (完璧版)
 */
export async function POST(request) {
    try {
        const { code } = await request.json()

        // 1. 環境変数の取得とバリデーション
        const LINE_CLIENT_ID = process.env.NEXT_PUBLIC_LINE_CLIENT_ID
        const LINE_CLIENT_SECRET = process.env.LINE_CLIENT_SECRET
        const LINE_AUTH_SECRET = process.env.LINE_AUTH_SECRET || 'hourensou-secret-2024-v2'
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
        const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://horenso.hitokoto.tech'

        if (!LINE_CLIENT_ID || !LINE_CLIENT_SECRET || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
            throw new Error('Server Configuration Error: Missing environment variables')
        }

        // 2. LINE Authorization Code を Access Token に交換
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
        if (!tokens.access_token) throw new Error(`LINE Token Error: ${tokens.error_description || 'Failed to exchange code'}`)

        // 3. LINE プロフィールの取得
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

        // 4. Supabase クライアントの準備
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        const adminClient = SUPABASE_SERVICE_ROLE_KEY
            ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
            : null

        // 5. サインインを試行 (ユーザーが存在する場合)
        console.log(`[Auth] Attempting login for ${email}`)
        let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        // 6. ユーザーが存在しない場合はサインアップ
        if (signInError) {
            console.log('[Auth] User not found, signing up...')
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: { data: metadata }
            })

            if (signUpError) {
                // 万が一の競合（同時アクセス等）への配慮
                if (signUpError.message.includes('already exists') || signUpError.message.includes('registered')) {
                    const retry = await supabase.auth.signInWithPassword({ email, password })
                    if (retry.error) throw new Error(`Auth Error: ${retry.error.message}`)
                    signInData = retry.data
                } else {
                    throw new Error(`Signup Error: ${signUpError.message}`)
                }
            } else {
                signInData = signUpData
            }
        }

        // 7. プロフィール情報の更新 (非必須のため、失敗しても無視してログイン継続)
        if (signInData?.user && adminClient) {
            try {
                console.log('[Auth] Updating user metadata...')
                await adminClient.auth.admin.updateUserById(signInData.user.id, {
                    user_metadata: metadata
                })

                // profiles テーブルがある場合はそちらも更新
                const { error: profileError } = await adminClient
                    .from('profiles')
                    .upsert({
                        id: signInData.user.id,
                        username: profile.displayName,
                        avatar_url: profile.pictureUrl,
                        updated_at: new Date().toISOString()
                    })
                if (profileError) console.warn('[Auth] Profile sync warning:', profileError.message)
            } catch (e) {
                console.warn('[Auth] Profile sync failed (not critical):', e.message)
            }
        }

        if (!signInData?.session) throw new Error('No session returned from Supabase')

        // 8. 成功レスポンス
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
            name: err.name,
            stack: err.stack,
            type: typeof err
        }, { status: 500 })
    }
}
