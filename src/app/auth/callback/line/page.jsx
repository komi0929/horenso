'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LineCallbackPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        const signinWithLine = async () => {
            const code = searchParams.get('code')
            const state = searchParams.get('state')
            const savedState = localStorage.getItem("line_auth_state")

            if (!code || state !== savedState) {
                console.error("Invalid state or missing code")
                return router.push('/')
            }

            try {
                const response = await fetch('/api/auth/line', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        code,
                        redirectUri: `${window.location.origin}/auth/callback/line`
                    })
                })

                const data = await response.json()

                if (!response.ok || !data?.session_link) {
                    throw new Error(data?.error || "No session link returned")
                }

                window.location.href = data.session_link
            } catch (err) {
                console.error("Login verification failed:", err)
                router.push('/')
            }
        }

        signinWithLine()
    }, [searchParams, router])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <div className="w-12 h-12 border-4 border-[#06C755] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-bold">LINEでログイン中...</p>
        </div>
    )
}
