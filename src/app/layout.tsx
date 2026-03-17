import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "وكيل المرجع الذكي | Al-Marjaa AI Agent",
  description: "نظام Agentic متكامل للبرمجة والتطوير باستخدام لغة المرجع. وكيل ذكي يمكنه كتابة الكود، تنفيذه، وتصحيح الأخطاء تلقائياً.",
  keywords: ["Al-Marjaa", "AI Agent", "وكيل ذكي", "برمجة", "تطوير", "Agentic", "لغة المرجع"],
  authors: [{ name: "رضوان دالي حمدوني" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "وكيل المرجع الذكي",
    description: "نظام Agentic متكامل للبرمجة والتطوير",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "وكيل المرجع الذكي",
    description: "نظام Agentic متكامل للبرمجة والتطوير",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning>
      <head>
        <link 
          rel="preconnect" 
          href="https://fonts.googleapis.com" 
        />
        <link 
          rel="preconnect" 
          href="https://fonts.gstatic.com" 
          crossOrigin="anonymous" 
        />
        <link 
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700&family=Tajawal:wght@300;400;500;700;800&display=swap" 
          rel="stylesheet" 
        />
        <style>{`
          :root {
            --font-arabic: 'Noto Sans Arabic', 'Tajawal', sans-serif;
          }
          
          body {
            font-family: var(--font-arabic), var(--font-geist-sans), sans-serif;
          }
          
          code, pre, .font-mono {
            font-family: var(--font-geist-mono), 'Fira Code', monospace;
          }
        `}</style>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
