'use client'

import { useRouter } from 'next/navigation'
import { Plus, Settings, Archive, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

const colors = [
    { name: 'all', bg: 'bg-gray-200', label: '全て' },
    { name: 'yellow', bg: 'bg-yellow-200', label: '黄' },
    { name: 'pink', bg: 'bg-pink-200', label: 'ピンク' },
    { name: 'blue', bg: 'bg-blue-200', label: '青' },
    { name: 'green', bg: 'bg-green-200', label: '緑' },
]

export function Footer({ filter, setFilter }) {
    const router = useRouter()

    return (
        <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/80 backdrop-blur-md border-t border-gray-100 px-4 py-3 z-50">
            <div className="flex items-center justify-between">
                {/* Color Filters */}
                <div className="flex gap-2">
                    {colors.map((color) => (
                        <button
                            key={color.name}
                            onClick={() => setFilter(color.name === 'all' ? null : color.name)}
                            className={cn(
                                "w-7 h-7 rounded-full transition-all duration-200 shadow-sm",
                                color.bg,
                                filter === color.name || (filter === null && color.name === 'all')
                                    ? "ring-2 ring-offset-2 ring-pink-400 scale-110"
                                    : "hover:scale-105"
                            )}
                            title={color.label}
                        />
                    ))}
                </div>

                {/* Navigation Icons */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/')}
                        className="p-2 text-gray-500 hover:text-pink-500 transition-colors"
                        title="ホーム"
                    >
                        <Home size={22} />
                    </button>
                    <button
                        onClick={() => router.push('/read')}
                        className="p-2 text-gray-500 hover:text-pink-500 transition-colors"
                        title="既読履歴"
                    >
                        <Archive size={22} />
                    </button>
                    <button
                        onClick={() => router.push('/admin')}
                        className="p-2 text-gray-500 hover:text-pink-500 transition-colors"
                        title="管理"
                    >
                        <Settings size={22} />
                    </button>
                </div>

                {/* Add Button */}
                <button
                    onClick={() => router.push('/add')}
                    className={cn(
                        "w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-rose-500",
                        "flex items-center justify-center shadow-lg shadow-pink-200",
                        "hover:scale-105 active:scale-95 transition-transform"
                    )}
                >
                    <Plus size={28} className="text-white" />
                </button>
            </div>
        </footer>
    )
}
