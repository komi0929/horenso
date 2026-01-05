'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/hooks/useStore'
import { Layout } from '@/components/Layout'
import { Footer } from '@/components/Footer'
import { Toast } from '@/components/Toast'
import { Login } from '@/components/Login'
import { Feed } from '@/components/Feed'

export default function HomePage() {
    const { user, initAuth } = useStore()
    const [filter, setFilter] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const init = async () => {
            // Handle Supabase magic link hash (access_token in URL)
            if (typeof window !== 'undefined') {
                const hash = window.location.hash
                if (hash && hash.includes('access_token')) {
                    // Supabase will handle the hash automatically when we call getSession
                    // Clear the hash from URL for cleaner UX
                    window.history.replaceState(null, '', window.location.pathname)
                }
            }

            await initAuth()
            setIsLoading(false)
        }
        init()
    }, [])

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-rose-50 to-sky-50">
                <div className="w-12 h-12 border-4 border-pink-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-bold">読み込み中...</p>
            </div>
        )
    }

    if (!user) {
        return <Login />
    }

    return (
        <Layout>
            <main className="pt-4">
                <header className="px-4 pb-4 border-b border-gray-100">
                    <h1 className="text-2xl font-bold text-gray-800">ホウレンソウ</h1>
                    <p className="text-sm text-gray-500">チームの情報共有ボード</p>
                </header>
                <Feed filter={filter} />
            </main>
            <Footer filter={filter} setFilter={setFilter} />
            <Toast />
        </Layout>
    )
}
