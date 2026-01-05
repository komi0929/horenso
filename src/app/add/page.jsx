'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ImagePlus, Send, Loader2 } from 'lucide-react'
import { useStore } from '@/hooks/useStore'
import { cn } from '@/lib/utils'

const colors = [
    { name: 'yellow', bg: 'bg-[#FEF9C3]', ring: 'ring-yellow-400' },
    { name: 'pink', bg: 'bg-[#FCE7F3]', ring: 'ring-pink-400' },
    { name: 'blue', bg: 'bg-[#DBEAFE]', ring: 'ring-blue-400' },
    { name: 'green', bg: 'bg-[#DCFCE7]', ring: 'ring-green-400' },
]

export default function AddPage() {
    const router = useRouter()
    const { addNote, user, showToast } = useStore()
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [color, setColor] = useState('yellow')
    const [image, setImage] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const fileInputRef = useRef(null)

    // Ensure user is loaded
    useEffect(() => {
        if (!user) {
            // Wait a bit for auth to init
            const timer = setTimeout(() => {
                if (!useStore.getState().user) {
                    showToast('ログインが必要です')
                    router.push('/')
                }
            }, 2000)
            return () => clearTimeout(timer)
        }
    }, [user, router, showToast])

    const handleImageChange = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast('画像サイズが大きすぎます(5MBまで)')
                return
            }
            const reader = new FileReader()
            reader.onloadend = () => setImage(reader.result)
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!title.trim() || isSubmitting) return

        setIsSubmitting(true)
        const success = await addNote({
            title,
            content,
            color,
            image,
        })

        if (success) {
            router.push('/')
        } else {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#FFF5F7] flex justify-center">
            <div className="w-full max-w-md bg-white min-h-screen shadow-lg relative flex flex-col">
                {/* Header */}
                <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center gap-4 z-10">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">新規投稿</h1>
                </header>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 overflow-y-auto">
                    {/* Title */}
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-400 ml-1">見出し</label>
                        <input
                            type="text"
                            placeholder="何について共有しますか？"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-[#FF4D8D] focus:outline-none transition-all text-xl font-bold text-gray-800 placeholder:text-gray-300"
                            required
                        />
                    </div>

                    {/* Content */}
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-400 ml-1">内容</label>
                        <textarea
                            placeholder="詳しく教えてください..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={6}
                            className="w-full px-4 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 focus:bg-white focus:border-[#FF4D8D] focus:outline-none transition-all resize-none text-gray-700 placeholder:text-gray-300"
                        />
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-400 ml-1">写真 (任意)</label>
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            className="hidden"
                        />
                        {!image ? (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-32 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#FF4D8D]/50 hover:bg-pink-50 hover:text-[#FF4D8D] transition-all group"
                            >
                                <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                    <ImagePlus size={24} />
                                </div>
                                <span className="font-bold text-sm">写真を添付する</span>
                            </button>
                        ) : (
                            <div className="relative rounded-2xl overflow-hidden shadow-lg animate-in fade-in zoom-in duration-300">
                                <img src={image} alt="Preview" className="w-full h-48 object-cover" />
                                <button
                                    type="button"
                                    onClick={() => setImage(null)}
                                    className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors backdrop-blur-md"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Color Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-400 ml-1">ふせんの色</label>
                        <div className="flex items-center gap-4">
                            {colors.map((c) => (
                                <button
                                    key={c.name}
                                    type="button"
                                    onClick={() => setColor(c.name)}
                                    className={cn(
                                        "w-12 h-12 rounded-2xl transition-all shadow-sm border-2",
                                        c.bg,
                                        color === c.name ? "border-[#FF4D8D] scale-110 shadow-md ring-4 ring-[#FF4D8D]/10" : "border-transparent hover:scale-105"
                                    )}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="h-10" />
                </form>

                {/* Fixed Footer with Submit Button */}
                <div className="p-6 bg-gradient-to-t from-white via-white to-transparent border-t border-gray-50">
                    <button
                        onClick={handleSubmit}
                        disabled={!title.trim() || isSubmitting}
                        className={cn(
                            "w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all",
                            "bg-[#FF4D8D] text-white shadow-xl shadow-pink-100",
                            "hover:bg-[#FF3377] hover:-translate-y-1 active:translate-y-0",
                            "disabled:bg-gray-200 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed"
                        )}
                    >
                        {isSubmitting ? (
                            <Loader2 className="animate-spin" size={24} />
                        ) : (
                            <>
                                <Send size={20} />
                                投稿を完了する
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
