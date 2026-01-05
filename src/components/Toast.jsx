'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useStore } from '@/hooks/useStore'

export function Toast() {
    const { toast, hideToast } = useStore()

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => {
                hideToast()
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [toast, hideToast])

    return (
        <AnimatePresence>
            {toast && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm"
                >
                    <div className="bg-gray-800 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between">
                        <span className="text-sm">{toast.message}</span>
                        <div className="flex items-center gap-2">
                            {toast.undoAction && (
                                <button
                                    onClick={() => {
                                        toast.undoAction()
                                        hideToast()
                                    }}
                                    className="text-pink-300 font-bold text-sm hover:text-pink-200"
                                >
                                    元に戻す
                                </button>
                            )}
                            <button onClick={hideToast} className="text-gray-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
