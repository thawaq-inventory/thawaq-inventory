'use client';

import { useState, useEffect, use } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, Eye, CheckCircle, Clock } from 'lucide-react';

export default function StockCountRequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Read branchIds from localStorage
        let userBranchId = 'all';
        try {
            const saved = localStorage.getItem('selectedBranches');
            if (saved) {
                const branches = JSON.parse(saved);
                userBranchId = branches.join(',');
            }
        } catch(e) {}
        fetchRequests(userBranchId);
    }, []);

    const fetchRequests = async (userBranchId: string) => {
        setLoading(true);
        setError(null);
        try {
            const branchIds = userBranchId || 'all';
            const res = await fetch(`/api/inventory/requests?branchIds=${branchIds}`);
            if (!res.ok) throw new Error('Failed to fetch requests');
            const data = await res.json();
            setRequests(data);
        } catch (err: any) {
            setError(err.message || 'Error fetching requests');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex h-64 justify-center items-center"><Loader2 className="animate-spin w-8 h-8 text-sky-500" /></div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Stock Counts Review</h1>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
            )}

            <Card className="border-none shadow-sm ring-1 ring-slate-200/50">
                <CardHeader>
                    <CardTitle className="text-lg">Recent Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Branch</th>
                                    <th className="px-4 py-3">Submitted By</th>
                                    <th className="px-4 py-3">Items Counted</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {requests.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                            No stock counts pending review.
                                        </td>
                                    </tr>
                                ) : (
                                    requests.map(req => (
                                        <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                {new Date(req.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-900">{req.branch?.name}</td>
                                            <td className="px-4 py-3">{req.user?.name}</td>
                                            <td className="px-4 py-3">{req._count?.items} items</td>
                                            <td className="px-4 py-3">
                                                {req.status === 'PENDING' && <span className="inline-flex flex-row items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock className="w-3 h-3" /> Pending</span>}
                                                {req.status === 'APPROVED' && <span className="inline-flex flex-row items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3" /> Approved</span>}
                                                {req.status === 'REJECTED' && <span className="inline-flex flex-row items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Link href={`/admin/inventory/requests/${req.id}`}>
                                                    <Button size="sm" variant="ghost" className="text-sky-600 hover:text-sky-700 hover:bg-sky-50">
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        Review
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
