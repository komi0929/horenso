'use client'

import { motion } from 'framer-motion'
import { CheckCircle, BookOpen, User, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const colorMap = {
    yellow: 'bg-[#FEF9C3] border-[#FDE047] shadow-yellow-100',
    pink: 'bg-[#FCE7F3] border-[#F9A8D4] shadow-pink-100',
    blue: 'bg-[#DBEAFE] border-[#93C5FD] shadow-blue-100',
    green: 'bg-[#DCFCE7] border-[#86EFAC] shadow-green-100',
}

export function StickyNote({ note, onToggleRead, onSelect }) {
    const colorClass = colorMap[note.color] || 'bg-white border-gray-200 shadow-gray-100'

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20, transition: { duration: 0.2 } }}
            whileHover={{ y: -4, scale: 1.01 }}
            className={cn(
                "relative p-5 rounded-[2rem] border-2 shadow-xl cursor-pointer overflow-hidden",
                "transition-all duration-300",
                colorClass
            )}
            onClick={() => onSelect && onSelect(note)}
        >
            {/* Gloss Effect */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />

            {/* Tape Element */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-16 h-6 bg-white/30 backdrop-blur-sm rotate-2 shadow-sm border border-white/20" />

            {/* Author Avatar */}
            <div className="absolute top-4 right-4 w-10 h-10 rounded-2xl bg-white shadow-lg flex items-center justify-center overflow-hidden border-2 border-white z-10 rotate-3 transition-transform hover:rotate-0">
                {note.avatar ? (
                    <img src={note.avatar} alt={note.author} className="w-full h-full object-cover" />
                ) : (
                    <div className="bg-gradient-to-br from-pink-100 to-rose-200 w-full h-full flex items-center justify-center">
                        <User size={20} className="text-white" />
                    </div>
                )}
            </div>

            {/* Content Container */}
            <div className="pr-12">
                <h3 className="font-black text-gray-800 text-xl mb-2 line-clamp-1 tracking-tight leading-tight">
                    {note.title}
                </h3>
                <p className="text-gray-600/80 text-sm line-clamp-2 mb-4 font-medium leading-relaxed">
                    {note.content}
                </p>

                {/* Footer and Actions */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{note.author}</span>
                        <span className="text-[10px] font-bold text-gray-400 opacity-60">{note.date}</span>
                    </div>

                    <div className="flex gap-2">
                        {note.image && (
                            <div className="p-2 rounded-xl bg-white/40 backdrop-blur-sm text-[#FF4D8D]">
                                <ImageIcon size={16} />
                            </div>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onToggleRead && onToggleRead(note)
                            }}
                            className={cn(
                                "flex items-center justify-center w-10 h-10 rounded-xl transition-all shadow-sm",
                                "bg-white/60 hover:bg-white text-gray-400 hover:text-green-500 active:scale-95"
                            )}
                        >
                            <CheckCircle size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
