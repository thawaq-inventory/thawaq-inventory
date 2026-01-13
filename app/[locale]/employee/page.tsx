'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from "@/i18n/routing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ClipboardList, ArrowRight, Receipt, Calendar, Clock, LogOut, User } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { EmployeeBranchSwitcher } from "./_components/EmployeeBranchSwitcher";

export default function EmployeeLanding() {
    const t = useTranslations('Employee');
    const tCommon = useTranslations('Common');
    const router = useRouter();
    const [employeeName, setEmployeeName] = useState<string>('');

    // Check authentication and get employee name
    useEffect(() => {
        const session = localStorage.getItem('employeeSession');
        if (!session) {
            router.push('/employee/login');
            return;
        }

        try {
            const data = JSON.parse(session);
            setEmployeeName(data.name || 'Employee');
        } catch (err) {
            console.error('Error parsing session:', err);
            router.push('/employee/login');
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('employeeSession');
        router.push('/employee/login');
    };

    const tasks = [
        {
            title: t('timesheet.title'),
            description: t('timesheet.clockIn'),
            icon: Clock,
            href: '/employee/timesheet',
        },
        {
            title: t('shifts.title'),
            description: t('shifts.description'),
            icon: Calendar,
            href: '/employee/shifts',
        },
        {
            title: t('receiveStock'),
            description: t('receiveStockDesc'),
            icon: Package,
            href: '/employee/receiving',
        },
        {
            title: t('expenses.title'),
            description: t('expenses.subtitle'),
            icon: Receipt,
            href: '/employee/expenses',
        },
        {
            title: t('stockCount'),
            description: t('stockCountDesc'),
            icon: ClipboardList,
            href: '/employee/count',
        }
    ];

    return (
        <div className="min-h-screen p-6 bg-slate-50 pb-[env(safe-area-inset-bottom)]">
            {/* Header Bar */}
            <header className="max-w-2xl mx-auto mb-8">
                <div className="flex items-center justify-between">
                    {/* Left side - User info */}
                    <div className="flex items-center gap-2 text-slate-600">
                        <User className="w-5 h-5" />
                        <span className="font-medium">{employeeName}</span>
                    </div>

                    {/* Right side - Language and Logout */}
                    <div className="flex items-center gap-3">
                        <EmployeeBranchSwitcher />
                        <LanguageSwitcher />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLogout}
                            className="text-slate-500 hover:text-red-600 hover:bg-red-50"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            {tCommon('signOut') || 'Logout'}
                        </Button>
                    </div>
                </div>
            </header>

            <div className="max-w-2xl w-full mx-auto">
                <div className="mb-12 text-center">
                    <div className="mb-8 flex justify-center">
                        <Link href="/employee">
                            <Logo size="xl" />
                        </Link>
                    </div>
                    <h1 className="text-2xl font-bold mb-2 text-slate-900">
                        {t('chooseTask')}
                    </h1>
                    <p className="text-slate-500">{t('selectTaskDesc')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tasks.map((task) => {
                        const Icon = task.icon;
                        return (
                            <Card
                                key={task.href}
                                className="cursor-pointer group relative overflow-hidden border border-slate-200 hover:border-teal-500/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white"
                                onClick={() => router.push(task.href)}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-teal-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <CardHeader className="text-center pb-6 pt-8 relative z-10">
                                    <div className="flex justify-center mb-6">
                                        <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl group-hover:from-teal-50 group-hover:to-teal-100 shadow-sm group-hover:shadow-md transition-all duration-300 ring-1 ring-slate-100 group-hover:ring-teal-100">
                                            <Icon className="w-10 h-10 text-slate-600 group-hover:text-teal-600 transition-colors duration-300" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-xl font-bold mb-2 text-slate-900 group-hover:text-teal-700 transition-colors">{task.title}</CardTitle>
                                    <CardDescription className="text-slate-500 group-hover:text-slate-600 transition-colors">
                                        {task.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pb-8 flex justify-center relative z-10">
                                    <span className="text-sm font-medium text-teal-600 flex items-center gap-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                        {t('tapToContinue')} <ArrowRight className="w-4 h-4" />
                                    </span>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
