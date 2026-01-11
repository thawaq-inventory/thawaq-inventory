'use client';

import { useTranslations } from 'next-intl';
import { Link, useRouter } from "@/i18n/routing";
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ClipboardList, Scan, ArrowRight, Receipt, Calendar } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function EmployeeLanding() {
    const t = useTranslations('Employee');
    const router = useRouter();

    // Check authentication
    useEffect(() => {
        const session = localStorage.getItem('employeeSession');
        if (!session) {
            router.push('/employee/login');
        }
    }, [router]);

    const tasks = [
        {
            title: t('receiveStock'),
            description: t('receiveStockDesc'),
            icon: Package,
            href: '/employee/receiving',
        },
        {
            title: t('stockCount'),
            description: t('stockCountDesc'),
            icon: ClipboardList,
            href: '/employee/count',
        },
        {
            title: t('expenses.title'),
            description: t('expenses.subtitle'),
            icon: Receipt,
            href: '/employee/expenses',
        },
        {
            title: 'My Shifts',
            description: 'View your upcoming work schedule',
            icon: Calendar,
            href: '/employee/shifts',
        },
        {
            title: t('scanItem'),
            description: t('scanItemDesc'),
            icon: Scan,
            href: '/employee/scan',
        }
    ];

    return (
        <div className="min-h-screen p-6 flex items-center justify-center bg-slate-50">
            <div className="max-w-2xl w-full mx-auto">
                <header className="mb-12 text-center">
                    <div className="mb-8 flex justify-center relative">
                        <Link href="/employee">
                            <Logo size="xl" />
                        </Link>
                        <div className="absolute right-0 top-0">
                            <LanguageSwitcher />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold mb-2 text-slate-900">
                        {t('chooseTask')}
                    </h1>
                    <p className="text-slate-500">{t('selectTaskDesc')}</p>
                </header>

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
