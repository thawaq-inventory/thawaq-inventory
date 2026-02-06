"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface PLAccount {
    code: string;
    name: string;
    type: string;
    total: number;
}

interface PLData {
    period: {
        start: string;
        end: string;
    };
    summary: {
        revenue: number;
        expenses: number;
        netProfit: number;
        margin: string | number;
        operatingRevenue?: number;
        operatingExpenses?: number;
        operatingProfit?: number;
        operatingMargin?: string | number;
    };
    revenueAccounts: PLAccount[];
    expenseAccounts: PLAccount[];
}

export default function ReportsPage() {
    const [plData, setPLData] = useState<PLData | null>(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [branches, setBranches] = useState<any[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string>('all');

    useEffect(() => {
        // Set default dates to current month
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        setStartDate(firstDay.toISOString().split('T')[0]);
        setEndDate(lastDay.toISOString().split('T')[0]);

        // Fetch Branches
        const fetchBranches = async () => {
            try {
                const res = await fetch('/api/accounting/branches');
                if (res.ok) setBranches(await res.json());
            } catch (e) { console.error(e); }
        };
        fetchBranches();

        // Load stored branch
        const stored = localStorage.getItem('selectedBranch');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setSelectedBranchId(parsed.id);
            } catch (e) { }
        }
    }, []);

    useEffect(() => {
        if (startDate && endDate) {
            fetchPL();
        }
    }, [startDate, endDate, selectedBranchId]);

    const fetchPL = async () => {
        setLoading(true);
        try {
            const branchQuery = selectedBranchId && selectedBranchId !== 'all' ? `&branchId=${selectedBranchId}` : '';
            const response = await fetch(
                `/api/accounting/reports/pl?startDate=${startDate}&endDate=${endDate}${branchQuery}`
            );
            const data = await response.json();
            setPLData(data);
        } catch (error) {
            console.error('Failed to fetch P&L:', error);
        } finally {
            setLoading(false);
        }
    };

    const isProfit = (plData?.summary.netProfit || 0) >= 0;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Profit & Loss Statement</h1>
                <p className="text-slate-500 mt-1">Financial performance and multi-branch consolidation</p>
            </div>

            {/* Date Range & Branch Selector */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Report Settings
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row md:items-end gap-4">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Branch Context</Label>
                            <div className="w-[200px]">
                                <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Branch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Global (Consolidated)</SelectItem>
                                        {branches.map(b => (
                                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button onClick={fetchPL} disabled={loading}>
                            {loading ? 'Loading...' : 'Generate Report'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="text-center py-12 text-slate-500">Loading report...</div>
            ) : plData ? (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-600">Revenue</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                    <span className="text-2xl font-bold text-slate-900">
                                        ${plData.summary.revenue.toFixed(2)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-600">Expenses</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <TrendingDown className="w-4 h-4 text-red-500" />
                                    <span className="text-2xl font-bold text-slate-900">
                                        ${plData.summary.expenses.toFixed(2)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-600">Net Profit</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <DollarSign className={`w-4 h-4 ${isProfit ? 'text-green-500' : 'text-red-500'}`} />
                                    <span className={`text-2xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                                        ${Math.abs(plData.summary.netProfit).toFixed(2)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-600">Profit Margin</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <span className={`text-2xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                                    {plData.summary.margin}%
                                </span>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detailed Report */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Detailed Statement</CardTitle>
                            <CardDescription>
                                Period: {new Date(plData.period.start).toLocaleDateString()} - {new Date(plData.period.end).toLocaleDateString()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* Revenue Section */}
                                <div>
                                    <h3 className="font-semibold text-lg text-slate-900 mb-3">Revenue</h3>
                                    {plData.revenueAccounts.length === 0 ? (
                                        <p className="text-slate-500 text-sm">No revenue recorded</p>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Account</TableHead>
                                                    <TableHead className="text-right">Amount</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {plData.revenueAccounts.map((account) => (
                                                    <TableRow key={account.code}>
                                                        <TableCell>
                                                            <div className="font-medium">{account.name}</div>
                                                            <div className="text-xs text-slate-500">{account.code}</div>
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono">
                                                            ${account.total.toFixed(2)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow className="font-semibold bg-green-50">
                                                    <TableCell>Total Revenue</TableCell>
                                                    <TableCell className="text-right font-mono text-green-700">
                                                        ${plData.summary.revenue.toFixed(2)}
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    )}
                                </div>

                                {/* Expenses Section */}
                                <div className="border-t pt-6">
                                    <h3 className="font-semibold text-lg text-slate-900 mb-3">Expenses</h3>
                                    {plData.expenseAccounts.length === 0 ? (
                                        <p className="text-slate-500 text-sm">No expenses recorded</p>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Account</TableHead>
                                                    <TableHead className="text-right">Amount</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {plData.expenseAccounts.map((account) => (
                                                    <TableRow key={account.code}>
                                                        <TableCell>
                                                            <div className="font-medium">{account.name}</div>
                                                            <div className="text-xs text-slate-500">{account.code}</div>
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono">
                                                            ${account.total.toFixed(2)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow className="font-semibold bg-red-50">
                                                    <TableCell>Total Expenses</TableCell>
                                                    <TableCell className="text-right font-mono text-red-700">
                                                        ${plData.summary.expenses.toFixed(2)}
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    )}
                                </div>

                                {/* Net Profit */}
                                <div className="border-t-2 border-slate-300 pt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xl font-bold text-slate-900">Net Profit (Loss)</span>
                                        <span className={`text-2xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                                            {isProfit ? '' : '-'}${Math.abs(plData.summary.netProfit).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            ) : (
                <Card>
                    <CardContent className="text-center py-12 text-slate-500">
                        Select a date range to generate the report
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
