'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, TrendingDown, DollarSign, Package } from "lucide-react";

interface WasteLog {
    id: string;
    product: { name: string };
    quantity: number;
    reason: string;
    costImpact: number;
    notes?: string;
    createdAt: string;
}

interface WasteSummary {
    summary: {
        totalCost: number;
        totalQuantity: number;
        totalItems: number;
    };
    byReason: Record<string, { count: number; cost: number; quantity: number }>;
    topProducts: Array<{ productName: string; cost: number; quantity: number }>;
}

export default function WasteManagementPage() {
    const t = useTranslations('Admin');
    const [wasteLogs, setWasteLogs] = useState<WasteLog[]>([]);
    const [summary, setSummary] = useState<WasteSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [logsRes, summaryRes] = await Promise.all([
                fetch('/api/waste'),
                fetch('/api/waste/summary')
            ]);
            const logs = await logsRes.json();
            const summaryData = await summaryRes.json();
            setWasteLogs(logs);
            setSummary(summaryData);
        } catch (error) {
            console.error('Error fetching waste data:', error);
        } finally {
            setLoading(false);
        }
    };

    const reasonColors: Record<string, string> = {
        EXPIRED: 'bg-red-100 text-red-700',
        DAMAGED: 'bg-orange-100 text-orange-700',
        OVER_PREP: 'bg-yellow-100 text-yellow-700',
        SPOILED: 'bg-purple-100 text-purple-700',
        OTHER: 'bg-gray-100 text-gray-700',
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-slate-500">Loading...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Waste Management</h1>
                    <p className="text-slate-500 mt-1">Track and analyze inventory waste</p>
                </div>
                <Button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Log Waste
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Waste Cost</CardTitle>
                        <DollarSign className="w-4 h-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {summary?.summary.totalCost.toFixed(2)} JOD
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{summary?.summary.totalItems} items wasted</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Quantity</CardTitle>
                        <Package className="w-4 h-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            {summary?.summary.totalQuantity.toFixed(1)}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Units wasted</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Top Reason</CardTitle>
                        <TrendingDown className="w-4 h-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            {summary && Object.entries(summary.byReason).sort((a, b) => b[1].cost - a[1].cost)[0]?.[0] || 'N/A'}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Most common waste reason</p>
                    </CardContent>
                </Card>
            </div>

            {/* Waste by Reason */}
            <Card>
                <CardHeader>
                    <CardTitle>Waste by Reason</CardTitle>
                    <CardDescription>Breakdown of waste costs by reason</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {summary && Object.entries(summary.byReason).map(([reason, data]) => (
                            <div key={reason} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${reasonColors[reason]}`}>
                                        {reason}
                                    </span>
                                    <span className="text-sm text-slate-600">{data.count} items</span>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-slate-900">{data.cost.toFixed(2)} JOD</div>
                                    <div className="text-xs text-slate-500">{data.quantity.toFixed(1)} units</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Top Wasted Products */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Wasted Products</CardTitle>
                    <CardDescription>Products with highest waste cost</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {summary?.topProducts.slice(0, 5).map((product, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                                        #{index + 1}
                                    </div>
                                    <span className="font-medium text-slate-900">{product.productName}</span>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-red-600">{product.cost.toFixed(2)} JOD</div>
                                    <div className="text-xs text-slate-500">{product.quantity.toFixed(1)} units</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Waste Logs */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Waste Logs</CardTitle>
                    <CardDescription>Latest waste entries</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {wasteLogs.slice(0, 10).map((log) => (
                            <div key={log.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                                <div className="flex-1">
                                    <div className="font-medium text-slate-900">{log.product.name}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${reasonColors[log.reason]}`}>
                                            {log.reason}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {new Date(log.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {log.notes && <p className="text-xs text-slate-500 mt-1">{log.notes}</p>}
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-red-600">{log.costImpact.toFixed(2)} JOD</div>
                                    <div className="text-xs text-slate-500">{log.quantity} units</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
