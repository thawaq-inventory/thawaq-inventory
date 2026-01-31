'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, Scale } from "lucide-react";
import { getCostingReport, CostingRow } from '@/app/actions/analytics';
import { getRevenueAudit, AuditResult } from '@/app/actions/audit';

export default function ProfitabilityInsights() {
    const [data, setData] = useState<CostingRow[]>([]);
    const [audit, setAudit] = useState<AuditResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const [report, auditResult] = await Promise.all([
                getCostingReport(),
                getRevenueAudit()
            ]);

            // Default Sort: Highest Cost % First
            const sorted = report.sort((a, b) => b.costPercent - a.costPercent);

            setData(sorted);
            setAudit(auditResult);
            setLoading(false);
        }
        load();
    }, []);

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-500" /></div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Menu Engineering</h1>
                    <p className="text-slate-600 mt-2">Analyze item profitability and food cost percentages.</p>
                </div>
                <div className="flex gap-4">
                    <Card className="p-3 bg-white border-slate-200">
                        <div className="text-xs text-slate-500 uppercase font-bold">Avg Food Cost</div>
                        <div className="text-xl font-bold text-slate-900">
                            {data.length > 0
                                ? (data.reduce((acc, i) => acc + (i.costPercent || 0), 0) / data.filter(i => i.costPercent > 0).length).toFixed(1)
                                : 0}%
                        </div>
                    </Card>
                </div>
            </div>

            {/* REVENUE AUDIT CARD */}
            {audit && (
                <div className="animate-in slide-in-from-top-4 duration-500">
                    <Card className={`border-l-4 ${audit.status === 'MATCH' ? 'border-l-green-500' : 'border-l-orange-500'}`}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                                {audit.status === 'MATCH'
                                    ? <CheckCircle className="w-5 h-5 text-green-600" />
                                    : <Scale className="w-5 h-5 text-orange-600" />
                                }
                                <CardTitle className="text-lg">Financial Integrity Check</CardTitle>
                            </div>
                            <CardDescription>Compares Reported Revenue (POS Cash) vs Theoretical Revenue (Menu Prices).</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-8 items-center">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Reported (POS)</p>
                                    <p className="text-2xl font-bold text-slate-800">{audit.reportedRevenue.toFixed(2)} JOD</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Theoretical (System)</p>
                                    <p className="text-2xl font-bold text-slate-800">{audit.theoreticalRevenue.toFixed(2)} JOD</p>
                                </div>
                                <div className="h-10 w-px bg-slate-200 mx-2"></div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Discrepancy</p>
                                    <p className={`text-2xl font-mono font-bold ${audit.status === 'MATCH' ? 'text-green-600' : 'text-orange-600'}`}>
                                        {audit.discrepancy.toFixed(2)} JOD
                                    </p>
                                    {audit.status === 'MISMATCH' && (
                                        <Badge variant="outline" className="mt-1 text-orange-600 border-orange-200 bg-orange-50">
                                            Revenue Mismatch Detected
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Item Profitability</CardTitle>
                    <CardDescription>
                        Items are sorted by status. <span className="text-red-600 font-bold">Red</span> indicates high food cost ({'>'}40%).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Menu Item</TableHead>
                                <TableHead>Recipe / Source</TableHead>
                                <TableHead className="text-right">Selling Price</TableHead>
                                <TableHead className="text-right">Food Cost</TableHead>
                                <TableHead className="text-right">Gross Profit</TableHead>
                                <TableHead className="text-right">Cost %</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((row) => (
                                <TableRow key={row.id} className={row.status === 'CRITICAL' ? 'bg-red-50 hover:bg-red-100' : ''}>
                                    <TableCell className="font-medium text-slate-900">{row.posName}</TableCell>
                                    <TableCell className="text-slate-500 text-sm">{row.recipeName}</TableCell>
                                    <TableCell className="text-right">{row.sellingPrice.toFixed(2)}</TableCell>
                                    <TableCell className="text-right text-slate-600">{row.foodCost.toFixed(3)}</TableCell>
                                    <TableCell className="text-right font-medium text-green-700">{row.grossProfit.toFixed(3)}</TableCell>
                                    <TableCell className="text-right font-bold">
                                        {row.sellingPrice > 0 ? row.costPercent.toFixed(1) + '%' : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {row.status === 'CRITICAL' && <Badge variant="destructive" className="bg-red-600">High Cost</Badge>}
                                        {row.status === 'WARNING' && <Badge variant="outline" className="text-amber-600 border-amber-600 bg-amber-50">Warning</Badge>}
                                        {row.status === 'GOOD' && <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">Healthy</Badge>}
                                        {row.status === 'MISSING_RECIPE' && <Badge variant="secondary" className="bg-slate-200 text-slate-600">No Recipe</Badge>}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
