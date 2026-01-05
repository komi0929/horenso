'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ImagePlus, Send } from 'lucide-react'
import { useStore } from '@/hooks/useStore'
import { cn } from '@/lib/utils'

const colors = [
    { name: 'yellow', bg: 'bg-yellow-200', ring: 'ring-yellow-400' },
    { name: 'pink', bg: 'bg-pink-200', ring: 'ring-pink-400' },
    { name: 'blue', bg: 'bg-blue-200', ring: 'ring-blue-400' },
    { name: 'green', bg: 'bg-green-200', ring: 'ring-green-400' },
]

export default function AddPage() {
    const router = useRouter()
    const { addNote, user } = useStore()
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [color, setColor] = useState('yellow')
    const [image, setImage] = useState(null)
    const fileInputRef = useRef(null)

    const handleImageChange = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => setImage(reader.result)
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!title.trim()) return

        await addNote({
            title,
            content,
            color,
            image,
            author: user?.user_metadata?.name || 'Unknown'
        })

        router.push('/')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-sky-50">
            {/* Header */}
            <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b px-4 py-3 flex items-center gap-4 z-10">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-gray-800">新規投稿</h1>
            </header>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Title */}
                <input
                    type="text"
                    placeholder="タイトル"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-pink-400 focus:outline-none transition-colors text-lg font-bold"
                />

                {/* Content */}
                <textarea
                    placeholder="内容を入力..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-pink-400 focus:outline-none transition-colors resize-none"
                />

                {/* Image Upload */}
                <div>
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-pink-400 hover:text-pink-500 transition-colors"
                    >
                        <ImagePlus size={20} />
                        <span>画像を追加</span>
                    </button>
                    {image && (
                        <div className="mt-2 relative rounded-xl overflow-hidden">
                            <img src={image} alt="Preview" className="w-full max-h-40 object-cover" />
                            <button
                                type="button"
                                onClick={() => setImage(null)}
                                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full text-xs"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </div>

                {/* Color Selection */}
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">色：</span>
                    {colors.map((c) => (
                        <button
                            key={c.name}
                            type="button"
                            onClick={() => setColor(c.name)}
                            className={cn(
                                "w-8 h-8 rounded-full transition-all",
                                c.bg,
                                color === c.name ? `ring-2 ring-offset-2 ${c.ring} scale-110` : "hover:scale-105"
                            )}
                        />
                    ))}
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={!title.trim()}
                    className={cn(
                        "w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all",
                        "bg-gradient-to-r from-pink-400 to-rose-500 text-white shadow-lg shadow-pink-200",
                        "hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                >
                    <Send size={20} />
                    投稿する
                </button>
            </form>
        </div>
    )
}
