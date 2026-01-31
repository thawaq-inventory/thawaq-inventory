'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Logo } from "@/components/ui/logo";
import BranchSwitcher from "@/components/BranchSwitcher";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
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
    Target,
    Store,
    DollarSign,
    Receipt,
    Calendar,
    Building2,
    Shield,
    Clock,
    Menu,
    X,
    ArrowLeftRight
} from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";


export function AdminLayoutClient({
    children,
    locale
}: {
    children: React.ReactNode;
    locale: string;
}) {
    const t = useTranslations('Admin');
    const router = useRouter();
    const pathname = usePathname();
    const [inventoryOpen, setInventoryOpen] = useState(pathname?.includes('/inventory'));
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userName, setUserName] = useState<string>('');
    const [userInitials, setUserInitials] = useState<string>('AD');

    // Fetch logged-in user info
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/auth/me');

                if (res.status === 401) {
                    // Not authenticated, redirect to login
                    router.push('/admin/login');
                    return;
                }

                if (res.ok) {
                    const data = await res.json();
                    if (data.user?.name) {
                        setUserName(data.user.name);
                        // Create initials from name
                        const nameParts = data.user.name.split(' ');
                        const initials = nameParts.length > 1
                            ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
                            : nameParts[0].substring(0, 2);
                        setUserInitials(initials.toUpperCase());
                    }
                }
            } catch (error) {
                console.error('Failed to fetch user info:', error);
            }
        };
        fetchUser();
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    // If on login page, render without admin layout
    if (pathname?.includes('/login')) {
        return <>{children}</>;
    }

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
                    : 'text-slate-600 hover:text-white dark:text-slate-400 dark:hover:text-white hover:bg-gradient-to-r hover:from-sky-500 hover:to-sky-600'
                    } ${className}`}
            >
                <Icon className="w-5 h-5" />
                {children}
            </Link>
        );
    };

    const handleLogout = () => {
        // Navigate to logout page which handles the API call and redirect
        window.location.href = `/${locale}/admin/logout`;
    };

    return (
        <div className="flex min-h-screen bg-[#F5F5F7] dark:bg-[#0B0F19]">
            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                w-64 bg-white dark:bg-[#0B0F19] border-r border-slate-200 dark:border-white/5 flex flex-col fixed inset-y-0 z-50
                transition-transform duration-300 ease-in-out
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0
            `}>
                <div className="h-20 flex items-center justify-between px-4 border-b border-slate-100 dark:border-white/5">
                    <Link href="/admin">
                        <Logo size="md" />
                    </Link>
                    {/* Close button - mobile only */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMobileMenuOpen(false)}
                        className="md:hidden h-10 w-10 text-slate-500"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {/* Dashboard */}
                    <NavLink href="/admin" icon={LayoutDashboard}>
                        {t('dashboard')}
                    </NavLink>

                    {/* ===== SECTION 1: OPERATIONS ===== */}
                    <div className="pt-4 pb-2">
                        <div className="px-3 mb-2">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Operations
                            </h3>
                        </div>

                        <NavLink href="/admin/menu" icon={Menu}>
                            Menu Manager
                        </NavLink>

                        <NavLink href="/admin/recipes" icon={BookOpen}>
                            Recipe Engineer
                        </NavLink>

                        <NavLink href="/admin/insights/costing" icon={TrendingUp}>
                            Profitability Insights
                        </NavLink>

                        <NavLink href="/admin/waste" icon={Trash2}>
                            Waste Management
                        </NavLink>

                        <NavLink href="/admin/par-levels" icon={Target}>
                            Par Levels
                        </NavLink>

                        {/* Inventory Submenu */}
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
                            <div className="ml-6 mt-1 space-y-1 border-l-2 border-slate-200 dark:border-white/10 pl-2">
                                <NavLink href="/admin/inventory/dashboard" icon={BarChart3}>
                                    {t('analytics')}
                                </NavLink>
                                <NavLink href="/admin/products" icon={ClipboardList}>
                                    {t('products')}
                                </NavLink>
                                <NavLink href="/admin/inventory/history" icon={History}>
                                    Sales History
                                </NavLink>
                                <NavLink href="/admin/inventory/import" icon={ArrowLeftRight}>
                                    Import & Mapping
                                </NavLink>
                                <NavLink href="/admin/inventory/transfers" icon={ArrowLeftRight}>
                                    Stock Transfers
                                </NavLink>
                                <NavLink href="/admin/inventory/settings" icon={Settings}>
                                    {t('settings')}
                                </NavLink>
                            </div>
                        )}
                    </div>

                    {/* ===== SECTION 2: ACCOUNTING ===== */}
                    <div className="pt-4 pb-2">
                        <div className="px-3 mb-2">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {t('accounting')}
                            </h3>
                        </div>

                        <NavLink href="/admin/accounting/journal" icon={FileText}>
                            {t('journalEntries')}
                        </NavLink>

                        <NavLink href="/admin/accounting/reports" icon={TrendingUp}>
                            {t('plReports')}
                        </NavLink>

                        <NavLink href="/admin/accounting/accounts" icon={BookOpen}>
                            {t('chartOfAccounts')}
                        </NavLink>

                        <NavLink href="/admin/expenses" icon={Receipt}>
                            Expenses
                        </NavLink>

                        <NavLink href="/admin/accounting/settings" icon={Settings}>
                            Settings (Mappings)
                        </NavLink>
                    </div>

                    {/* ===== SECTION 3: EMPLOYEES ===== */}
                    <div className="pt-4 pb-2">
                        <div className="px-3 mb-2">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Employees
                            </h3>
                        </div>

                        <NavLink href="/admin/employees" icon={Users}>
                            Manage Employees
                        </NavLink>

                        <NavLink href="/admin/roster" icon={Calendar}>
                            Shifts Roster
                        </NavLink>

                        <NavLink href="/admin/attendance" icon={Clock}>
                            Attendance
                        </NavLink>

                        <NavLink href="/admin/payroll/approvals" icon={DollarSign}>
                            Payroll Approvals
                        </NavLink>
                    </div>

                    {/* ===== SECTION 4: SETTINGS ===== */}
                    <div className="pt-4 pb-2">
                        <div className="px-3 mb-2">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Settings
                            </h3>
                        </div>

                        <NavLink href="/admin/users" icon={Shield}>
                            All Users
                        </NavLink>

                        <NavLink href="/admin/branches" icon={Building2}>
                            Branches
                        </NavLink>

                        <NavLink href="/admin/locations" icon={Store}>
                            Locations
                        </NavLink>

                        <NavLink href="/admin/settings" icon={Settings}>
                            General Settings
                        </NavLink>
                    </div>
                </nav>

                <div className="p-4 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3 px-3 py-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-200">
                            {userInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">{userName || t('adminUser')}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{t('adminEmail')}</p>
                        </div>
                        <LanguageSwitcher />
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        {t('signOut')}
                    </Button>

                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
                {/* Header Bar */}
                <header className="h-16 bg-white dark:bg-[#0B0F19] border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        {/* Hamburger Menu - Mobile only */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMobileMenuOpen(true)}
                            className="md:hidden h-10 w-10 text-slate-600 dark:text-slate-400"
                        >
                            <Menu className="w-6 h-6" />
                        </Button>
                        <BranchSwitcher
                            userBranchId={null}
                            isSuperAdmin={true}
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <ModeToggle />
                        <p className="text-sm text-slate-600 dark:text-slate-400 hidden sm:block">Welcome back, {userName || 'Admin'}</p>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
