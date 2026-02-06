'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle } from "lucide-react";
import { format } from 'date-fns';

interface Log {
    id: string;
    product: {
        name: string;
        arabicName?: string | null;
        sku: string;
        unit: string;
    };
    changeAmount: number;
    reason: string;
    user: {
        name: string;
    } | null;
    createdAt: string;
}

export default function InventoryHistory() {
    const t = useTranslations();
    const locale = useLocale();
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('ALL');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (filterType !== 'ALL') params.append('type', filterType);

            const response = await fetch(`/api/inventory/logs?${params.toString()}`);
            const data = await response.json();
            setLogs(data);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLogs();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, filterType]);

    const getReasonBadge = (reason: string) => {
        switch (reason) {
            case 'RESTOCK':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Restock</span>;
            case 'WASTE':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Waste</span>;
            case 'ADJUSTMENT':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Adjustment</span>;
            case 'SALE':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Sale</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">{reason}</span>;
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory History</h1>
                <p className="text-slate-500 mt-1">Track all stock movements and adjustments</p>
            </div>

            <div className="dashboard-card rounded-xl overflow-hidden mb-6">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-4 bg-white">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                            placeholder="Search by product or SKU..."
                            className="pl-9 h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-full sm:w-[180px] h-10 bg-white border-slate-200">
                            <SelectValue placeholder="Filter by Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Actions</SelectItem>
                            <SelectItem value="RESTOCK">Restock</SelectItem>
                            <SelectItem value="WASTE">Waste</SelectItem>
                            <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                            <SelectItem value="SALE">Sale</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b-slate-200">
                                <TableHead className="font-semibold text-slate-700 py-4">Date & Time</TableHead>
                                <TableHead className="font-semibold text-slate-700 py-4">Product</TableHead>
                                <TableHead className="font-semibold text-slate-700 py-4">Action</TableHead>
                                <TableHead className="font-semibold text-slate-700 py-4">Change</TableHead>
                                <TableHead className="font-semibold text-slate-700 py-4">User</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                                        Loading history...
                                    </TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                                        No logs found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id} className="hover:bg-slate-50 transition-colors border-b-slate-100">
                                        <TableCell className="py-4 text-slate-600 text-sm">
                                            {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="font-medium text-slate-900">
                                                {locale === 'ar' && log.product.arabicName
                                                    ? log.product.arabicName
                                                    : log.product.name}
                                            </div>
                                            <div className="text-xs text-slate-500 font-mono">{log.product.sku}</div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            {getReasonBadge(log.reason)}
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className={`flex items-center gap-1 font-mono font-medium ${log.changeAmount > 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {log.changeAmount > 0 ? (
                                                    <ArrowUpRight className="w-4 h-4" />
                                                ) : (
                                                    <ArrowDownRight className="w-4 h-4" />
                                                )}
                                                {log.changeAmount > 0 ? '+' : ''}{log.changeAmount} {log.product.unit}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 text-sm text-slate-600">
                                            {log.user?.name || 'System'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
