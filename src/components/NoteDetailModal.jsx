'use client'

import { motion } from 'framer-motion'
import { X, User } from 'lucide-react'

export function NoteDetailModal({ note, onClose }) {
    if (!note) return null

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                            {note.avatar ? (
                                <img src={note.avatar} alt={note.author} className="w-full h-full object-cover" />
                            ) : (
                                <User size={20} className="text-gray-400" />
                            )}
                        </div>
                        <div>
                            <p className="font-bold text-gray-800">{note.author}</p>
                            <p className="text-xs text-gray-500">{note.date}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    <h2 className="text-xl font-bold text-gray-800 mb-3">{note.title}</h2>

                    {note.image && (
                        <div className="mb-4 rounded-xl overflow-hidden">
                            <img src={note.image} alt="添付画像" className="w-full" />
                        </div>
                    )}

                    <p className="text-gray-600 whitespace-pre-wrap">{note.content}</p>
                </div>
            </motion.div>
        </motion.div>
    )
}
