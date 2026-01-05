'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useStore } from '@/hooks/useStore'
import { StickyNote } from '@/components/StickyNote'
import { NoteDetailModal } from '@/components/NoteDetailModal'

export default function ReadPage() {
    const router = useRouter()
    const { notes, toggleRead, showToast } = useStore()
    const [selectedNote, setSelectedNote] = useState(null)

    const readNotes = notes.filter(note => note.isRead)

    const handleToggleRead = (note) => {
        toggleRead(note.id)
        showToast('未読に戻しました', () => toggleRead(note.id))
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-sky-50">
            {/* Header */}
            <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b px-4 py-3 flex items-center gap-4 z-10">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-gray-800">既読履歴</h1>
            </header>

            {readNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <p className="text-lg">既読の投稿はありません</p>
                </div>
            ) : (
                <div className="p-4 space-y-4">
                    <AnimatePresence mode="popLayout">
                        {readNotes.map((note) => (
                            <StickyNote
                                key={note.id}
                                note={note}
                                onToggleRead={handleToggleRead}
                                onSelect={setSelectedNote}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <AnimatePresence>
                {selectedNote && (
                    <NoteDetailModal note={selectedNote} onClose={() => setSelectedNote(null)} />
                )}
            </AnimatePresence>
        </div>
    )
}
