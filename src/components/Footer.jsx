'use client'

import { useRouter } from 'next/navigation'
import { Plus, Settings, Archive, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

const colors = [
    { name: 'all', bg: 'bg-gray-200', label: '全て' },
    { name: 'yellow', bg: 'bg-[#FEF9C3]', label: '黄' },
    { name: 'pink', bg: 'bg-[#FCE7F3]', label: '赤' },
    { name: 'blue', bg: 'bg-[#DBEAFE]', label: '青' },
    { name: 'green', bg: 'bg-[#DCFCE7]', label: '緑' },
]

export function Footer({ filter, setFilter }) {
    const router = useRouter()

    return (
        <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/70 backdrop-blur-xl border-t border-gray-100 px-6 py-4 z-50">
            <div className="flex items-center justify-between gap-4">
                {/* Color Filters */}
                <div className="flex gap-2 bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100">
                    {colors.map((color) => (
                        <button
                            key={color.name}
                            onClick={() => setFilter(color.name === 'all' ? null : color.name)}
                            className={cn(
                                "w-7 h-7 rounded-xl transition-all duration-300 shadow-sm",
                                color.bg,
                                filter === color.name || (filter === null && color.name === 'all')
                                    ? "scale-110 shadow-md ring-2 ring-[#FF4D8D]/20 border border-[#FF4D8D]/40"
                                    : "hover:scale-105 opacity-60 hover:opacity-100"
                            )}
                            title={color.label}
                        />
                    ))}
                </div>

                {/* Navigation Icons */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => router.push('/')}
                        className="p-2.5 text-gray-400 hover:text-[#FF4D8D] hover:bg-pink-50 rounded-xl transition-all"
                    >
                        <Home size={22} strokeWidth={2.5} />
                    </button>
                    <button
                        onClick={() => router.push('/read')}
                        className="p-2.5 text-gray-400 hover:text-[#FF4D8D] hover:bg-pink-50 rounded-xl transition-all"
                    >
                        <Archive size={22} strokeWidth={2.5} />
                    </button>
                    {/* Private admin URL */}
                    <button
                        onClick={() => router.push('/secret-admin-console-2025')}
                        className="p-2.5 text-gray-400 hover:text-[#FF4D8D] hover:bg-pink-50 rounded-xl transition-all"
                    >
                        <Settings size={22} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Add Button */}
                <button
                    onClick={() => router.push('/add')}
                    className={cn(
                        "w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF4D8D] to-[#FF8BA7]",
                        "flex items-center justify-center shadow-xl shadow-pink-200",
                        "hover:scale-110 active:scale-90 hover:rotate-3 transition-all duration-300"
                    )}
                >
                    <Plus size={32} className="text-white" strokeWidth={3} />
                </button>
            </div>
        </footer>
    )
}
