'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LineCallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState('LINE認証中...')
    const [error, setError] = useState(null)

    useEffect(() => {
        const handleLineCallback = async () => {
            try {
                // Step 1: Validate state
                const code = searchParams.get('code')
                const state = searchParams.get('state')
                const savedState = localStorage.getItem('line_auth_state')

                console.log('LINE callback started', { hasCode: !!code, stateMatch: state === savedState })

                if (!code) {
                    setError('認証コードがありません')
                    setTimeout(() => router.push('/'), 3000)
                    return
                }

                if (state !== savedState) {
                    console.warn('State mismatch:', { received: state, saved: savedState })
                    setError('セキュリティ検証に失敗しました')
                    setTimeout(() => router.push('/'), 3000)
                    return
                }

                // Step 2: Exchange code for session
                setStatus('ログイン処理中...')
                const response = await fetch('/api/auth/line', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code })
                })

                const data = await response.json()
                console.log('API response:', { ok: response.ok, hasSession: !!data.session })

                if (!response.ok) {
                    console.error('API error:', data)
                    setError(data.error || 'ログインに失敗しました')
                    setTimeout(() => router.push('/'), 3000)
                    return
                }

                if (!data.session) {
                    setError('セッション情報が取得できませんでした')
                    setTimeout(() => router.push('/'), 3000)
                    return
                }

                // Step 3: Set session in Supabase client
                setStatus('セッションを設定中...')
                const { supabase } = await import('@/lib/supabase')

                if (!supabase) {
                    setError('Supabaseの初期化に失敗しました')
                    setTimeout(() => router.push('/'), 3000)
                    return
                }

                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token
                })

                if (sessionError) {
                    console.error('Session error:', sessionError)
                    setError('セッションの設定に失敗しました')
                    setTimeout(() => router.push('/'), 3000)
                    return
                }

                // Step 4: Success - redirect to home
                setStatus('ログイン成功！リダイレクト中...')

                // Clean up state
                localStorage.removeItem('line_auth_state')

                // Redirect to home
                window.location.href = '/'

            } catch (err) {
                console.error('LINE callback error:', err)
                setError(`エラー: ${err.message}`)
                setTimeout(() => router.push('/'), 3000)
            }
        }

        handleLineCallback()
    }, [searchParams, router])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4 text-center">
                {!error ? (
                    <>
                        <div className="w-16 h-16 border-4 border-[#06C755] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                        <p className="text-gray-700 font-bold text-lg">{status}</p>
                        <p className="text-gray-400 text-sm mt-2">しばらくお待ちください...</p>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-red-500 text-2xl">✕</span>
                        </div>
                        <p className="text-red-600 font-bold text-lg">{error}</p>
                        <p className="text-gray-400 text-sm mt-2">ホーム画面にリダイレクトします...</p>
                    </>
                )}
            </div>
        </div>
    )
}

export default function LineCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4 text-center">
                    <div className="w-16 h-16 border-4 border-[#06C755] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="text-gray-700 font-bold text-lg">読み込み中...</p>
                </div>
            </div>
        }>
            <LineCallbackContent />
        </Suspense>
    )
}
