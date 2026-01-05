'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, Trash2, LogOut, ShieldCheck, Loader2 } from 'lucide-react'
import { useStore } from '@/hooks/useStore'
import { cn } from '@/lib/utils'

const colorMap = {
    yellow: 'bg-[#FEF9C3] border-yellow-200',
    pink: 'bg-[#FCE7F3] border-pink-200',
    blue: 'bg-[#DBEAFE] border-blue-200',
    green: 'bg-[#DCFCE7] border-green-200',
}

export default function AdminPage() {
    const router = useRouter()
    const { notes, deleteNote, restoreNote, showToast, logout, user } = useStore()
    const [isChecking, setIsChecking] = useState(true)

    useEffect(() => {
        // Simple admin check: currently just check if user is logged in
        // In real app, you'd check user.role or user.user_metadata.is_admin
        if (!user && !isChecking) {
            router.push('/')
        }

        const timer = setTimeout(() => setIsChecking(false), 1500)
        return () => clearTimeout(timer)
    }, [user, router])

    const handleDelete = async (note) => {
        const ok = window.confirm('この投稿を完全に削除しますか？')
        if (!ok) return

        await deleteNote(note.id)
        showToast('管理者が削除しました')
    }

    const handleLogout = async () => {
        await logout()
        router.push('/')
    }

    if (isChecking) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF5F7]">
                <Loader2 className="animate-spin text-[#FF4D8D]" size={40} />
                <p className="mt-4 text-gray-500 font-bold">アクセス権限を確認中...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#FFF5F7] flex justify-center selection:bg-pink-100">
            <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col">
                {/* Header */}
                <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-5 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push('/')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <ArrowLeft size={24} className="text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-lg font-black text-gray-800 flex items-center gap-2">
                                <ShieldCheck size={20} className="text-[#FF4D8D]" />
                                管理パネル
                            </h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Control</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="ログアウト"
                    >
                        <LogOut size={22} />
                    </button>
                </header>

                <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                    <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between border border-gray-100">
                        <span className="text-sm font-bold text-gray-500">アクティブな投稿</span>
                        <span className="text-2xl font-black text-gray-800">{notes.length}</span>
                    </div>

                    <div className="space-y-3">
                        {notes.map((note) => (
                            <div
                                key={note.id}
                                className={cn(
                                    "flex items-center justify-between p-4 rounded-2xl border-2 transition-all hover:scale-[1.02] bg-white shadow-sm",
                                    colorMap[note.color] || 'border-gray-100'
                                )}
                            >
                                <div className="flex-1 min-w-0 mr-4">
                                    <h3 className="font-bold text-gray-800 truncate">{note.title}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <img src={note.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + note.author} alt="" className="w-4 h-4 rounded-full" />
                                        <p className="text-[10px] font-bold text-gray-400 truncate tracking-tight">
                                            {note.author} • {note.date}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(note)}
                                    className="p-3 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all shadow-sm hover:shadow-red-200"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {notes.length === 0 && (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                                <Trash2 size={32} />
                            </div>
                            <p className="text-gray-400 font-bold">投稿はありません</p>
                        </div>
                    )}
                </div>

                <div className="p-6 text-center">
                    <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Hourensou Admin v2.0</p>
                </div>
            </div>
        </div>
    )
}
