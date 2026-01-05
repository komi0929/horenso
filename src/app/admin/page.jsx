'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, LogOut } from 'lucide-react'
import { useStore } from '@/hooks/useStore'
import { cn } from '@/lib/utils'

const colorMap = {
    yellow: 'bg-yellow-100',
    pink: 'bg-pink-100',
    blue: 'bg-blue-100',
    green: 'bg-green-100',
}

export default function AdminPage() {
    const router = useRouter()
    const { notes, deleteNote, restoreNote, showToast, logout } = useStore()

    const handleDelete = (note) => {
        deleteNote(note.id)
        showToast('削除しました', () => restoreNote(note))
    }

    const handleLogout = async () => {
        await logout()
        router.push('/')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-sky-50">
            {/* Header */}
            <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-lg font-bold text-gray-800">管理画面</h1>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <LogOut size={18} />
                    <span>ログアウト</span>
                </button>
            </header>

            <div className="p-4 space-y-3">
                <p className="text-sm text-gray-500 mb-4">全投稿: {notes.length}件</p>

                {notes.map((note) => (
                    <div
                        key={note.id}
                        className={cn(
                            "flex items-center justify-between p-3 rounded-xl border",
                            colorMap[note.color] || 'bg-amber-100'
                        )}
                    >
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-800 truncate">{note.title}</p>
                            <p className="text-xs text-gray-500">{note.author} • {note.date}</p>
                        </div>
                        <button
                            onClick={() => handleDelete(note)}
                            className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
