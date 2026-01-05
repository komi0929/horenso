'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCallbackPage() {
    const router = useRouter()
    const [status, setStatus] = useState('認証処理中...')

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Get hash from URL
                const hash = window.location.hash
                console.log('Auth callback - hash:', hash)

                if (!hash || !hash.includes('access_token')) {
                    setStatus('認証情報が見つかりません')
                    setTimeout(() => router.push('/'), 2000)
                    return
                }

                // Parse tokens from hash
                const params = new URLSearchParams(hash.substring(1))
                const accessToken = params.get('access_token')
                const refreshToken = params.get('refresh_token')

                console.log('Tokens found:', { accessToken: !!accessToken, refreshToken: !!refreshToken })

                if (!accessToken || !refreshToken) {
                    setStatus('トークンが不完全です')
                    setTimeout(() => router.push('/'), 2000)
                    return
                }

                // Import supabase dynamically
                const { supabase } = await import('@/lib/supabase')

                if (!supabase) {
                    setStatus('Supabase初期化エラー')
                    setTimeout(() => router.push('/'), 2000)
                    return
                }

                // Set the session
                setStatus('セッションを設定中...')
                const { data, error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken
                })

                console.log('setSession result:', { data, error })

                if (error) {
                    console.error('Session error:', error)
                    setStatus(`セッションエラー: ${error.message}`)
                    setTimeout(() => router.push('/'), 3000)
                    return
                }

                if (data?.session) {
                    setStatus('ログイン成功！リダイレクト中...')
                    // Clear hash and redirect to home
                    window.location.href = '/'
                } else {
                    setStatus('セッションが作成されませんでした')
                    setTimeout(() => router.push('/'), 2000)
                }

            } catch (err) {
                console.error('Auth callback error:', err)
                setStatus(`エラー: ${err.message}`)
                setTimeout(() => router.push('/'), 3000)
            }
        }

        handleCallback()
    }, [router])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-rose-50 to-sky-50">
            <div className="w-12 h-12 border-4 border-pink-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-bold">{status}</p>
            <p className="text-sm text-gray-400 mt-2">問題が発生した場合は、ブラウザのコンソールを確認してください</p>
        </div>
    )
}
