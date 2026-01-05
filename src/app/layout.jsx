'use client'

import { useEffect } from 'react'
import { useStore } from '@/hooks/useStore'
import { Toast } from '@/components/Toast'
import "./globals.css"
import { Outfit, Inter } from "next/font/google"

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-heading",
})

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-body",
})

export default function RootLayout({ children }) {
    const { initAuth } = useStore()

    useEffect(() => {
        initAuth()
    }, [initAuth])

    return (
        <html lang="ja">
            <body className={`${outfit.variable} ${inter.variable} antialiased`}>
                {children}
                <Toast />
            </body>
        </html>
    )
}
