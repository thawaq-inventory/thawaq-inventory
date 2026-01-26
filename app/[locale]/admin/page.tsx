'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, FileText, Users, ArrowRight, Receipt, Package } from "lucide-react";
import { Link } from '@/i18n/routing';

interface DashboardData {
    monthlyRevenue: number;
    monthlyExpenses: number;
    netProfit: number;
    pendingInvoices: number;
    vendorCount: number;
    lowStockItems: number;
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // For now, we'll fetch basic data from existing APIs
            // In a real app, you'd create a dedicated dashboard API endpoint
            const [vendorsRes, analyticsRes] = await Promise.all([
                fetch('/api/accounting/vendors'),
                fetch('/api/analytics')
            ]);

            const vendors = await vendorsRes.json();
            const analytics = await analyticsRes.json();

            setData({
                monthlyRevenue: 0, // Would come from accounting data
                monthlyExpenses: 0,
                netProfit: 0,
                pendingInvoices: 0,
                vendorCount: vendors.length || 0,
                lowStockItems: analytics.metrics?.lowStockItems || 0
            });
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !data) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-slate-500">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Welcome to Al Thawaq Accounting System</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="card-gradient-green metric-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white/90">Monthly Revenue</CardTitle>
                        <TrendingUp className="h-5 w-5 text-white" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white animated-number">{data.monthlyRevenue.toFixed(0)} JOD</div>
                        <p className="text-xs text-white/80 mt-1">
                            Current month
                        </p>
                    </CardContent>
                </Card>

                <Card className="card-gradient-purple metric-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white/90">Net Profit</CardTitle>
                        <DollarSign className="h-5 w-5 text-white" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white animated-number">{data.netProfit.toFixed(0)} JOD</div>
                        <p className="text-xs text-white/80 mt-1">
                            This month
                        </p>
                    </CardContent>
                </Card>

                <Card className="card-gradient-brand metric-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white/90">Pending Invoices</CardTitle>
                        <FileText className="h-5 w-5 text-white" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white animated-number">{data.pendingInvoices}</div>
                        <p className="text-xs text-white/80 mt-1">
                            Awaiting processing
                        </p>
                    </CardContent>
                </Card>

                <Card className="card-gradient-orange metric-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white/90">Active Vendors</CardTitle>
                        <Users className="h-5 w-5 text-white" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white animated-number">{data.vendorCount}</div>
                        <p className="text-xs text-white/80 mt-1">
                            Registered suppliers
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/admin/accounting/invoices">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Receipt className="w-6 h-6 text-blue-600" />
                                </div>
                                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                            </div>
                            <CardTitle className="text-lg">Record Invoice</CardTitle>
                            <CardDescription>Add new purchase invoice</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                <Link href="/admin/accounting/reports">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <TrendingUp className="w-6 h-6 text-green-600" />
                                </div>
                                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                            </div>
                            <CardTitle className="text-lg">View P&L</CardTitle>
                            <CardDescription>Profit & loss statement</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                <Link href="/admin/accounting/vendors">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Users className="w-6 h-6 text-purple-600" />
                                </div>
                                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                            </div>
                            <CardTitle className="text-lg">Manage Vendors</CardTitle>
                            <CardDescription>Add or edit suppliers</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
            </div>

            {/* Inventory Alert */}
            {data.lowStockItems > 0 && (
                <Card className="border-l-4 border-amber-500">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <Package className="w-5 h-5 text-amber-600" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-lg">Inventory Alert</CardTitle>
                                <CardDescription>
                                    {data.lowStockItems} items are running low on stock
                                </CardDescription>
                            </div>
                            <Link href="/admin/inventory/dashboard">
                                <Button variant="outline" size="sm">
                                    View Inventory
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                </Card>
            )}

            {/* Getting Started Guide */}
            <Card>
                <CardHeader>
                    <CardTitle>Getting Started</CardTitle>
                    <CardDescription>Quick guide to using the accounting system</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-slate-900 dark:bg-white dark:text-black text-white flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                            <div>
                                <h4 className="font-medium text-slate-900 dark:text-white">Add Vendors</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Set up your suppliers in the Vendors section</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-slate-900 dark:bg-white dark:text-black text-white flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                            <div>
                                <h4 className="font-medium text-slate-900 dark:text-white">Record Invoices</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Upload and record your purchase invoices</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-slate-900 dark:bg-white dark:text-black text-white flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                            <div>
                                <h4 className="font-medium text-slate-900 dark:text-white">View Reports</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Monitor your financial performance with P&L reports</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
