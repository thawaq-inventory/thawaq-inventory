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
    BookOpen
} from "lucide-react";
import { AdminLayoutClient } from './admin-layout-client';

export default async function AdminLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    return (
        <AdminLayoutClient locale={locale}>
            {children}
        </AdminLayoutClient>
    );
}
