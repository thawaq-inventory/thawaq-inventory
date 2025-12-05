'use client';

import { Logo } from "@/components/ui/logo";
import { Link } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";

export default function EmployeeFeaturesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [employeeName, setEmployeeName] = useState('');

    useEffect(() => {
        const sessionData = localStorage.getItem('employeeSession');
        if (!sessionData) {
            router.push('/employee/login');
            return;
        }

        try {
            const session = JSON.parse(sessionData);
            setEmployeeName(session.name || 'Employee');
        } catch (error) {
            router.push('/employee/login');
        }
    }, [router]);

    const handleLogout = async () => {
        try {
            await fetch('/api/employee/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('employeeSession');
            router.push('/employee/login');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link href="/employee">
                        <Logo size="sm" />
                    </Link>
                    <div className="flex items-center gap-4">
                        {employeeName && (
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-sm font-medium text-slate-700">{employeeName}</span>
                            </div>
                        )}
                        <button
                            onClick={handleLogout}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5 text-slate-600" />
                        </button>
                        <LanguageSwitcher />
                    </div>
                </div>
            </header>
            <main>
                {children}
            </main>
        </div>
    );
}
