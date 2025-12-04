import { Logo } from "@/components/ui/logo";
import { Link } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function EmployeeFeaturesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link href="/employee">
                        <Logo size="sm" />
                    </Link>
                    <LanguageSwitcher />
                </div>
            </header>
            <main>
                {children}
            </main>
        </div>
    );
}
