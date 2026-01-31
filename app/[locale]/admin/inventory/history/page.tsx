'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { FileText } from 'lucide-react';
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
}

export default function SalesHistoryPage() {
    const router = useRouter();
    const [reports, setReports] = useState<SalesReport[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await fetch('/api/inventory/sales-history');
            if (res.ok) {
                const data = await res.json();
                setReports(data);
            }
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Analysis History</h1>
                    <p className="text-slate-500">List of all uploaded sales reports and their variance analysis.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Upload History</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="p-4 text-center text-slate-500">Loading history...</div>
                    ) : reports.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 border-2 border-dashed rounded-lg">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No sales reports uploaded yet.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date / Time</TableHead>
                                    <TableHead>File Name</TableHead>
                                    <TableHead>Branch</TableHead>
                                    <TableHead>Report Date</TableHead>
                                    <TableHead className="text-right">Declared Rev</TableHead>
                                    <TableHead className="text-right">COGS</TableHead>
                                    <TableHead className="text-right">Variance</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reports.map((report) => (
                                    <TableRow
                                        key={report.id}
                                        className="cursor-pointer hover:bg-slate-50"
                                        onClick={() => router.push(`/admin/inventory/history/${report.id}`)}
                                    >
                                        <TableCell className="font-medium text-slate-900">
                                            {format(new Date(report.uploadDate), 'MMM dd, HH:mm')}
                                        </TableCell>
                                        <TableCell>{report.fileName}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{report.branch?.name || 'Unknown'}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {report.reportDate ?
                                                <span className="text-slate-900 font-medium">{format(new Date(report.reportDate), 'yyyy-MM-dd')}</span>
                                                : <span className="text-slate-400 italic">N/A</span>
                                            }
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {report.totalRevenue.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right text-slate-500">
                                            {report.totalCOGS.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className={report.variance < -1 ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                                                {report.variance.toFixed(2)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {report.status === 'SUCCESS' ? (
                                                <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20">
                                                    Success
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive">Failed</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
