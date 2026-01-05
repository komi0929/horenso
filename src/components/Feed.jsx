'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useStore } from '@/hooks/useStore'
import { StickyNote } from '@/components/StickyNote'
import { NoteDetailModal } from '@/components/NoteDetailModal'

export function Feed({ filter }) {
    const { notes, toggleRead, showToast } = useStore()
    const [selectedNote, setSelectedNote] = useState(null)

    const filteredNotes = notes
        .filter(note => !note.isRead)
        .filter(note => !filter || note.color === filter)

    const handleToggleRead = (note) => {
        toggleRead(note.id)
        showToast('既読にしました', () => toggleRead(note.id))
    }

    if (filteredNotes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <p className="text-lg">まだ投稿がありません</p>
                <p className="text-sm">右下の＋ボタンから追加しましょう</p>
            </div>
        )
    }

    return (
        <>
            <div className="p-4 pb-28 space-y-4">
                <AnimatePresence mode="popLayout">
                    {filteredNotes.map((note) => (
                        <StickyNote
                            key={note.id}
                            note={note}
                            onToggleRead={handleToggleRead}
                            onSelect={setSelectedNote}
                        />
                    ))}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {selectedNote && (
                    <NoteDetailModal note={selectedNote} onClose={() => setSelectedNote(null)} />
                )}
            </AnimatePresence>
        </>
    )
}
