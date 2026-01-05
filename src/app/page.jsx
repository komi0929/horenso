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

    useEffect(() => {
        initAuth()
    }, [])

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
