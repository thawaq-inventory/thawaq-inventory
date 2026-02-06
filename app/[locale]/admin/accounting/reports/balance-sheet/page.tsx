'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { ArrowLeft, Download } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function BalanceSheetPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [branches, setBranches] = useState<any[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string>('all');

    useEffect(() => {
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
        fetchReport();
    }, [selectedBranchId]);

    const fetchBranches = async () => {
        try {
            const res = await fetch('/api/accounting/branches');
            if (res.ok) setBranches(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const query = selectedBranchId && selectedBranchId !== 'all' ? `?branchId=${selectedBranchId}` : '';
            const res = await fetch(`/api/accounting/reports/balance-sheet${query}`);
            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-JO', { style: 'currency', currency: 'JOD' }).format(amount);
    };

    if (loading || !data) {
        return <div className="p-8 text-center">Loading Report...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <h1 className="text-2xl font-bold">Balance Sheet</h1>
                </div>
                <div className="flex gap-2">
                    <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select Branch" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Global (Consolidated)</SelectItem>
                            {branches.map(b => (
                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" /> Export
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ASSETS */}
                <Card className="md:col-span-1 border-t-4 border-t-emerald-500">
                    <CardHeader>
                        <CardTitle className="text-emerald-700">Assets</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableBody>
                                {data.assets.map((acc: any) => (
                                    <TableRow key={acc.id}>
                                        <TableCell>{acc.name}</TableCell>
                                        <TableCell className="text-right font-mono">{formatCurrency(acc.balance)}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="bg-slate-50 font-bold">
                                    <TableCell>Total Assets</TableCell>
                                    <TableCell className="text-right text-emerald-700">{formatCurrency(data.meta.totalAssets)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* LIABILITIES & EQUITY */}
                <div className="space-y-6">
                    <Card className="border-t-4 border-t-red-500">
                        <CardHeader>
                            <CardTitle className="text-red-700">Liabilities</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableBody>
                                    {data.liabilities.map((acc: any) => (
                                        <TableRow key={acc.id}>
                                            <TableCell>{acc.name}</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(acc.balance)}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-slate-50 font-bold">
                                        <TableCell>Total Liabilities</TableCell>
                                        <TableCell className="text-right text-red-700">{formatCurrency(data.meta.totalLiabilities)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card className="border-t-4 border-t-blue-500">
                        <CardHeader>
                            <CardTitle className="text-blue-700">Equity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableBody>
                                    {data.equity.map((acc: any) => (
                                        <TableRow key={acc.id}>
                                            <TableCell>
                                                {acc.name}
                                                {acc.id === 'retained-earnings' && <span className="ml-2 text-xs text-slate-400">(Calc)</span>}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(acc.balance)}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-slate-50 font-bold">
                                        <TableCell>Total Equity</TableCell>
                                        <TableCell className="text-right text-blue-700">{formatCurrency(data.meta.totalEquity)}</TableCell>
                                    </TableRow>
                                    <TableRow className="bg-slate-100 font-black border-t-2 border-slate-300">
                                        <TableCell>Total Liab & Equity</TableCell>
                                        <TableCell className="text-right text-slate-900">
                                            {formatCurrency(data.meta.totalLiabilities + data.meta.totalEquity)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
