'use client'

import { MessageCircle } from 'lucide-react'
import { generateLineAuthUrl } from '@/lib/lineAuth'

export function Login() {
    const handleLogin = () => {
        window.location.href = generateLineAuthUrl()
    }

    return (
        <div className="min-h-screen bg-[#06C755] flex flex-col items-center justify-center p-6 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-60 h-60 bg-white rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">ホウレンソウ</h1>
                <p className="text-gray-500 font-medium mb-6">チームのためのシンプル情報共有</p>

                <button
                    onClick={handleLogin}
                    className="w-full bg-[#06C755] hover:bg-[#05b34c] text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-3 text-lg"
                >
                    <div className="bg-white text-[#06C755] p-1 rounded-full">
                        <MessageCircle size={20} fill="currentColor" />
                    </div>
                    LINEでログイン
                </button>
            </div>
        </div>
    )
}
