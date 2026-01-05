'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, BookOpen, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const colorMap = {
    yellow: 'bg-yellow-100 border-yellow-300',
    pink: 'bg-pink-100 border-pink-300',
    blue: 'bg-blue-100 border-blue-300',
    green: 'bg-green-100 border-green-300',
}

export function StickyNote({ note, onToggleRead, onSelect }) {
    const colorClass = colorMap[note.color] || 'bg-amber-100 border-amber-300'

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, x: 200, y: -300 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={cn(
                "relative p-4 rounded-xl border-2 shadow-md cursor-pointer",
                "hover:shadow-lg transition-shadow",
                colorClass,
                note.isRead && "grayscale-[0.2]"
            )}
            onClick={() => onSelect && onSelect(note)}
        >
            {/* Author Avatar */}
            <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden border-2 border-white">
                {note.avatar ? (
                    <img src={note.avatar} alt={note.author} className="w-full h-full object-cover" />
                ) : (
                    <User size={16} className="text-gray-400" />
                )}
            </div>

            {/* Content */}
            <div className="ml-4">
                <h3 className="font-bold text-gray-800 text-lg mb-1 line-clamp-1">{note.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-2 mb-2">{note.content}</p>

                {/* Image Preview */}
                {note.image && (
                    <div className="mb-2 rounded-lg overflow-hidden">
                        <img src={note.image} alt="添付画像" className="w-full h-24 object-cover" />
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{note.author} • {note.date}</span>
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onSelect && onSelect(note)
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/50 hover:bg-white transition-colors"
                        >
                            <BookOpen size={12} />
                            <span>詳細</span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onToggleRead && onToggleRead(note)
                            }}
                            className={cn(
                                "flex items-center gap-1 px-2 py-1 rounded-full transition-colors",
                                note.isRead
                                    ? "bg-green-200 text-green-700"
                                    : "bg-white/50 hover:bg-white"
                            )}
                        >
                            <CheckCircle size={12} />
                            <span>{note.isRead ? '既読' : '未読'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
