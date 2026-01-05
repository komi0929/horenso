'use client'

import { cn } from '@/lib/utils'

export function Layout({ children }) {
    return (
        <div className={cn(
            "min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-sky-50",
            "flex justify-center"
        )}>
            <div className="w-full max-w-md min-h-screen bg-white/60 backdrop-blur-sm shadow-xl">
                {children}
            </div>
        </div>
    )
}
