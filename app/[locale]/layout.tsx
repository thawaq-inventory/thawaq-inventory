import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import "../globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: "Thawaq Inventory",
    description: "Restaurant Inventory Management",
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
        <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            <body className={inter.className}>
                <NextIntlClientProvider messages={messages}>
                    <div className="flex min-h-screen">
                        {/* Sidebar / Navigation for larger screens could go here */}
                        <main className="flex-1">
                            {children}
                        </main>
                    </div>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
