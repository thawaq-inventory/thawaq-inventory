import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import "../globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata, Viewport } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Al Thawaq Inventory",
    description: "Modern inventory management system for Al Thawaq restaurant",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Al Thawaq",
    },
    formatDetection: {
        telephone: false,
    },
    icons: {
        icon: [
            { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
            { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
        ],
        apple: [
            { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        ],
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    themeColor: "#0ea5e9",
    userScalable: false,
};

export default async function RootLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const messages = await getMessages();

    return (
        <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning>
            <body className={inter.className} suppressHydrationWarning>
                <NextIntlClientProvider messages={messages}>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="light"
                        enableSystem={false}
                        forcedTheme="light"
                        disableTransitionOnChange
                    >
                        <div className="flex min-h-screen bg-[#F5F5F7] dark:bg-[#0B0F19]">
                            {/* Sidebar / Navigation for larger screens could go here */}
                            <main className="flex-1">
                                {children}
                            </main>
                        </div>
                    </ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
