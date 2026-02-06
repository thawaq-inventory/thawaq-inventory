
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSearchParams } from 'next/navigation';
import { formatCurrency } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, TrendingUp, AlertTriangle } from "lucide-react";

interface VarianceData {
    period: { from: string, to: string };
    theoretical: { revenue: number, cogs: number };
    actual: { revenue: number, cogs: number };
    variance: { revenue: number, revenuePct: number, cogs: number, cogsPct: number };
}

export default function VariancePage() {
    const searchParams = useSearchParams();
    const [data, setData] = useState<VarianceData | null>(null);
    const [loading, setLoading] = useState(true);

    // Get Branch ID from Validated Cookie via API or Client Context?
    // Ideally we rely on the Server API reading the cookie, but our API expects a query param.
    // For now, let's fetch without branchId (Aggregate) or rely on a context provider if available.
    // Given the task "Global State Persistence", the branch switcher updates cookies. 
    // We can read 'branchId' from localStorage or let the user explicitly filter?
    // Best practice: The global branch switcher typically reloads the page or updates a URL param.
    // If it updates a cookie, we might need to rely on API reading the cookie if param is missing.
    // My API code checks `searchParams.get('branchId')`.

    // Simple approach: We'll fetch. If global switcher works via cookies/localstorage and triggers a reload, 
    // we need to know the branch. 
    // Actually, the Layout usually handles Branch context. 
    // I'll grab it from localStorage for now to be quick, matching other pages.

    useEffect(() => {
        const fetchVariance = async () => {
            setLoading(true);
            try {
                // Try to get branch from localStorage (common pattern in this app)
                let branchId = '';
                try {
                    const stored = localStorage.getItem('selectedBranch');
                    if (stored) branchId = JSON.parse(stored).id;
                } catch (e) { }

                const query = branchId ? `?branchId=${branchId}` : '';
                const res = await fetch(`/api/accounting/variance${query}`);
                const json = await res.json();
                setData(json);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchVariance();

        // Listen for storage events (if branch switcher updates local storage)
        const handleStorageChange = () => fetchVariance();
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('branch-change', handleStorageChange); // Custom event if exists

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('branch-change', handleStorageChange);
        };
    }, []);

    if (loading) return <div className="p-8 text-center">Loading Financial Data...</div>;
    if (!data) return <div className="p-8 text-center text-red-500">Failed to load data.</div>;

    const renderVarianceCard = (title: string, theo: number, actual: number, diff: number, pct: number, invertColor = false) => {
        const isPositive = diff >= 0;
        // Logic: 
        // For Revenue: Actual < Theo is BAD (Red).
        // For COGS: Actual > Theo is BAD (Red).

        let isBad = false;
        if (title === 'Revenue') isBad = diff < 0; // Missing Money
        if (title === 'COGS') isBad = diff > 0; // Overspending

        // High Variance Warning (> 5%)
        const isHighVariance = Math.abs(pct) > 5;
        const colorClass = isBad ? 'text-red-600' : 'text-emerald-600';
        const bgClass = isBad ? 'bg-red-50' : 'bg-emerald-50';

        return (
            <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">{title} Variance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-baseline justify-between">
                        <div className="text-2xl font-bold text-slate-900">
                            {formatCurrency(actual)}
                            <span className="text-xs font-normal text-slate-400 ml-2">Actual</span>
                        </div>
                        <div className={`flex items-center text-sm font-medium ${colorClass}`}>
                            {isBad ? <ArrowDownRight className="w-4 h-4 mr-1" /> : <ArrowUpRight className="w-4 h-4 mr-1" />}
                            {Math.abs(pct).toFixed(1)}%
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-slate-500 text-xs mb-1">Theoretical (POS)</p>
                            <p className="font-medium text-slate-700">{formatCurrency(theo)}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs mb-1">Variance (Gap)</p>
                            <p className={`font-medium ${colorClass}`}>{formatCurrency(diff)}</p>
                        </div>
                    </div>

                    {isHighVariance && (
                        <div className={`mt-3 p-2 rounded text-xs flex items-center ${bgClass} ${colorClass}`}>
                            <AlertTriangle className="w-3 h-3 mr-2" />
                            High Variance Detected (&gt;5%)
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-6 max-w-[100vw] overflow-x-hidden">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Variance Analysis</h1>
                <p className="text-slate-500">Theoretical (POS) vs Actual (Ledger) Comparison</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderVarianceCard('Revenue', data.theoretical.revenue, data.actual.revenue, data.variance.revenue, data.variance.revenuePct)}
                {renderVarianceCard('COGS', data.theoretical.cogs, data.actual.cogs, data.variance.cogs, data.variance.cogsPct, true)}
            </div>

            <Card className="overflow-hidden">
                <CardHeader>
                    <CardTitle>Detailed Breakdown</CardTitle>
                    <CardDescription>
                        Comparison of Theoretical calculations relative to Actual GL postings.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="table-responsive">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                                <tr>
                                    <th className="px-6 py-3">Metric</th>
                                    <th className="px-6 py-3">Theoretical (POS)</th>
                                    <th className="px-6 py-3">Actual (Ledger)</th>
                                    <th className="px-6 py-3">Variance</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr className="bg-white hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">Total Revenue</td>
                                    <td className="px-6 py-4">{formatCurrency(data.theoretical.revenue)}</td>
                                    <td className="px-6 py-4">{formatCurrency(data.actual.revenue)}</td>
                                    <td className={`px-6 py-4 ${data.variance.revenue < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {formatCurrency(data.variance.revenue)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {data.variance.revenue < 0
                                            ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Shortage</span>
                                            : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Surplus</span>
                                        }
                                    </td>
                                </tr>
                                <tr className="bg-white hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">Cost of Goods Sold</td>
                                    <td className="px-6 py-4">{formatCurrency(data.theoretical.cogs)}</td>
                                    <td className="px-6 py-4">{formatCurrency(data.actual.cogs)}</td>
                                    <td className={`px-6 py-4 ${data.variance.cogs > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {formatCurrency(data.variance.cogs)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {data.variance.cogs > 0
                                            ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Overspending</span>
                                            : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Efficient</span>
                                        }
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
