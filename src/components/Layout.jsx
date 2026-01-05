'use client'

import { cn } from '@/lib/utils'

export function Layout({ children }) {
    return (
        <div className={cn(
            "min-h-screen bg-[#FFF5F7]",
            "flex justify-center selection:bg-pink-100"
        )}>
            {/* Background Decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-200/30 blur-[100px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/30 blur-[100px] rounded-full" />
            </div>

            <div className="w-full max-w-md min-h-screen relative z-10 glass shadow-2xl overflow-x-hidden">
                {children}
            </div>
        </div>
    )
}
