'use client';

import { useState, useEffect, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { ArrowLeft, FileText, TrendingUp, AlertCircle, CheckCircle, DollarSign, Package } from 'lucide-react';
import { useRouter } from '@/i18n/routing';

interface SalesReport {
    id: string;
    fileName: string;
    uploadDate: string;
    reportDate: string | null;
    totalRevenue: number;
    totalCOGS: number;
    variance: number;
    status: string;
    branch: { name: string };
    errorDetails?: string;
}

export default function SalesReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const [report, setReport] = useState<SalesReport | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        try {
            const res = await fetch(`/api/inventory/sales-history/${resolvedParams.id}`);
            if (res.ok) {
                const data = await res.json();
                setReport(data);
            }
        } catch (error) {
            console.error('Failed to fetch report:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading report details...</div>;
    }

    if (!report) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-red-600">Report Not Found</h2>
                <Button variant="outline" onClick={() => router.back()} className="mt-4">Go Back</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analysis View</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        {report.fileName} • {format(new Date(report.uploadDate), 'MMM dd, yyyy HH:mm')}
                    </p>
                </div>
                <div className="ml-auto">
                    {report.status === 'SUCCESS' ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3 py-1 text-sm">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Success
                        </Badge>
                    ) : (
                        <Badge variant="destructive" className="px-3 py-1 text-sm">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Failed
                        </Badge>
                    )}
                </div>
            </div>

            {/* Financial Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Revenue */}
                <Card className="bg-white dark:bg-[#151B28] border-slate-200 dark:border-white/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Declared Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            JOD {report.totalRevenue.toFixed(2)}
                        </div>
                    </CardContent>
                </Card>

                {/* COGS */}
                <Card className="bg-white dark:bg-[#151B28] border-slate-200 dark:border-white/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Total COGS</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            JOD {report.totalCOGS.toFixed(2)}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Based on Live WAC</p>
                    </CardContent>
                </Card>

                {/* Variance */}
                <Card className="bg-white dark:bg-[#151B28] border-slate-200 dark:border-white/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Revenue Variance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${report.variance < -1 ? "text-red-500" : "text-emerald-500"}`}>
                            JOD {report.variance.toFixed(2)}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Declared vs Expected</p>
                    </CardContent>
                </Card>
            </div>

            {/* Details Section */}
            <Card className="bg-white dark:bg-[#151B28] border-slate-200 dark:border-white/5">
                <CardHeader>
                    <CardTitle>Report Details</CardTitle>
                    <CardDescription>Metadata and execution status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Transaction Date used</p>
                            <p className="text-lg font-semibold text-slate-900 dark:text-white">
                                {report.reportDate ? format(new Date(report.reportDate), 'yyyy-MM-dd') : 'N/A'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Branch</p>
                            <p className="text-lg font-semibold text-slate-900 dark:text-white">{report.branch?.name}</p>
                        </div>
                        {report.errorDetails && (
                            <div className="col-span-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
                                <p className="text-sm text-red-600 dark:text-red-400 font-medium">Error Details:</p>
                                <p className="text-sm text-red-700 dark:text-red-300">{report.errorDetails}</p>
                            </div>
                        )}
                        <div className="col-span-2">
                            <p className="text-sm font-medium text-slate-500">Note</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                This report was processed on {format(new Date(report.uploadDate), 'PP pp')}.
                                Inventory deductions were applied based on the recipes active at that time.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
