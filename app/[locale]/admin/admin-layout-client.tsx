'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Package,
    FileText,
    TrendingUp,
    Users,
    ChevronDown,
    ChevronRight,
    BarChart3,
    ClipboardList,
    History,
    Settings,
    LogOut,
    BookOpen,
    Trash2,
    Flame,
    Target,
    ChefHat,
    Store,
    DollarSign,
    Receipt,
    Tag
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { usePathname } from 'next/navigation';
import { LanguageSwitcher } from "@/components/LanguageSwitcher";


export function AdminLayoutClient({
    children,
    locale
}: {
    children: React.ReactNode;
    locale: string;
}) {
    const t = useTranslations('Admin');
    const pathname = usePathname();
    const [inventoryOpen, setInventoryOpen] = useState(pathname?.includes('/inventory'));

    const isActive = (path: string) => {
        if (path === '/admin') {
            return pathname === `/admin` || pathname === `/${locale}/admin`;
        }
        return pathname?.includes(path);
    };

    const NavLink = ({ href, icon: Icon, children, className = "" }: any) => {
        const active = isActive(href);
        return (
            <Link
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${active
                    ? 'nav-link-active'
                    : 'text-slate-600 hover:text-white hover:bg-gradient-to-r hover:from-sky-500 hover:to-sky-600'
                    } ${className}`}
            >
                <Icon className="w-5 h-5" />
                {children}
            </Link>
        );
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 z-50">
                <div className="h-20 flex items-center justify-center border-b border-slate-100">
                    <Link href="/admin">
                        <Logo size="md" />
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {/* Dashboard */}
                    <NavLink href="/admin" icon={LayoutDashboard}>
                        {t('dashboard')}
                    </NavLink>

                    {/* Recipes */}
                    <NavLink href="/admin/recipes" icon={ChefHat}>
                        Recipes
                    </NavLink>

                    {/* Operations Section */}
                    <div className="pt-4 pb-2">
                        <div className="px-3 mb-2">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Operations
                            </h3>
                        </div>

                        <NavLink href="/admin/waste" icon={Trash2}>
                            Waste Management
                        </NavLink>

                        <NavLink href="/admin/production" icon={Flame}>
                            Production Log
                        </NavLink>

                        <NavLink href="/admin/par-levels" icon={Target}>
                            Par Levels
                        </NavLink>
                    </div>

                    {/* Accounting Section */}
                    <div className="pt-4 pb-2">
                        <div className="px-3 mb-2">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {t('accounting')}
                            </h3>
                        </div>

                        <NavLink href="/admin/accounting/journal" icon={FileText}>
                            {t('journalEntries')}
                        </NavLink>

                        <NavLink href="/admin/accounting/invoices" icon={FileText}>
                            {t('invoices')}
                        </NavLink>

                        <NavLink href="/admin/accounting/reports" icon={TrendingUp}>
                            {t('plReports')}
                        </NavLink>

                        <NavLink href="/admin/accounting/accounts" icon={BookOpen}>
                            {t('chartOfAccounts')}
                        </NavLink>


                        <NavLink href="/admin/accounting/vendors" icon={Users}>
                            {t('vendors')}
                        </NavLink>

                        <NavLink href="/admin/expenses" icon={Receipt}>
                            Expenses
                        </NavLink>

                        <NavLink href="/admin/expenses/categories" icon={Tag}>
                            Expense Categories
                        </NavLink>
                    </div>

                    {/* Employees Section */}
                    <div className="pt-4 pb-2">
                        <div className="px-3 mb-2">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Employees
                            </h3>
                        </div>

                        <NavLink href="/admin/employees/pins" icon={Users}>
                            PIN Management
                        </NavLink>
                    </div>

                    {/* Inventory Section (Collapsible) */}
                    <div className="pt-4">
                        <div className="px-3 mb-2">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {t('inventory')}
                            </h3>
                        </div>

                        <button
                            onClick={() => setInventoryOpen(!inventoryOpen)}
                            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Package className="w-5 h-5" />
                                {t('inventory')}
                            </div>
                            {inventoryOpen ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            )}
                        </button>

                        {inventoryOpen && (
                            <div className="ml-6 mt-1 space-y-1 border-l-2 border-slate-200 pl-2">
                                <NavLink href="/admin/inventory/dashboard" icon={BarChart3}>
                                    {t('analytics')}
                                </NavLink>
                                <NavLink href="/admin/products" icon={ClipboardList}>
                                    {t('products')}
                                </NavLink>
                                <NavLink href="/admin/history" icon={History}>
                                    {t('history')}
                                </NavLink>
                                <NavLink href="/admin/inventory/settings" icon={Settings}>
                                    {t('settings')}
                                </NavLink>
                            </div>
                        )}
                    </div>

                    {/* Analytics Section */}
                    <div className="pt-4 pb-2">
                        <div className="px-3 mb-2">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Analytics
                            </h3>
                        </div>

                        <NavLink href="/admin/analytics/food-cost" icon={DollarSign}>
                            Food Cost %
                        </NavLink>
                    </div>

                    {/* Settings Section */}
                    <div className="pt-4 pb-2">
                        <div className="px-3 mb-2">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Settings
                            </h3>
                        </div>

                        <NavLink href="/admin/locations" icon={Store}>
                            Locations
                        </NavLink>
                    </div>
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 px-3 py-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                            AD
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{t('adminUser')}</p>
                            <p className="text-xs text-slate-500 truncate">{t('adminEmail')}</p>
                        </div>
                        <LanguageSwitcher />
                    </div>
                    <Button variant="ghost" className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50">
                        <LogOut className="w-4 h-4 mr-2" />
                        {t('signOut')}
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 pl-64 flex flex-col min-h-screen">
                {/* Page Content */}
                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
