import "@/styles/globals.css"
import { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { GeistMono } from "geist/font/mono"
import { SessionProvider } from "next-auth/react"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { AnnouncementBanner } from "@/components/accouncement"
import { Footer } from "@/components/footer"
import { Navbar } from "@/components/navbar"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
    title: {
        default: siteConfig.name,
        template: `%s - ${siteConfig.name}`,
    },
    description: siteConfig.description,
    icons: {
        icon: "/favicon.ico",
        shortcut: "/favicon-16x16.png",
        apple: "/apple-touch-icon.png",
    },
}

interface RootLayoutProps {
    children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="en" className={GeistMono.className}>
            <body className={cn("min-h-screen bg-background antialiased")}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                >
                    <Analytics />
                    <SpeedInsights />

                    <SessionProvider>
                        <div className="relative flex min-h-screen flex-col">
                            <AnnouncementBanner text="Authentication has been temporarily suspended due to the experimental models being non-operational." />
                            <Navbar />
                            <div className="flex-1">{children}</div>
                            <Footer />
                        </div>
                    </SessionProvider>
                    {/* <TailwindIndicator /> */}
                </ThemeProvider>
            </body>
        </html>
    )
}
