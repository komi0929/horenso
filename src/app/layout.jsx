import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata = {
    title: "ホウレンソウ - チーム情報共有アプリ",
    description: "チームメンバーと簡単に情報を共有できるPWAアプリ",
};

export default function RootLayout({ children }) {
    return (
        <html lang="ja">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                {children}
            </body>
        </html>
    );
}
