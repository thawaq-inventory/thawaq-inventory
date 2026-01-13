import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { PieChart, AlertCircle } from 'lucide-react';

export default async function WastageReportPage() {
    const cookieStore = await cookies();
    const selectedBranchCookie = cookieStore.get('selectedBranches');
    let branchId = null;

    if (selectedBranchCookie) {
        try {
            const branches = JSON.parse(selectedBranchCookie.value);
            if (branches && branches.length > 0 && branches[0] !== 'all' && branches[0] !== 'HEAD_OFFICE') {
                branchId = branches[0];
            }
        } catch (e) {
            console.error(e);
        }
    }

    if (!branchId) {
        return <div className="p-8 text-center text-red-600">Please select a specific branch to view its wastage report.</div>;
    }

    // Fetch Waste Transactions
    // We need to fetch product info (cost) to calculate value lost.
    const transactions = await prisma.inventoryTransaction.findMany({
        where: {
            sourceBranchId: branchId,
            type: 'WASTE'
        },
        include: {
            product: true,
            user: true
        },
        orderBy: {
            timestamp: 'desc'
        }
    });

    // Aggregate Data
    const summaryByReason: Record<string, { count: number, quantity: number, value: number }> = {};
    let totalValueLost = 0;

    transactions.forEach(tx => {
        // Parse reason from notes "Reason: Expired. ..."
        let reason = 'Unspecified';
        if (tx.notes && tx.notes.startsWith('Reason: ')) {
            const parts = tx.notes.split('.');
            reason = parts[0].replace('Reason: ', '').trim();
        }

        if (!summaryByReason[reason]) {
            summaryByReason[reason] = { count: 0, quantity: 0, value: 0 };
        }

        const value = tx.quantity * (tx.product.cost || 0);
        summaryByReason[reason].count += 1;
        summaryByReason[reason].quantity += tx.quantity;
        summaryByReason[reason].value += value;
        totalValueLost += value;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Wastage Report</h1>
                    <p className="text-slate-500">Analysis of inventory loss and spoilage.</p>
                </div>
                <div className="bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                    <p className="text-xs text-red-600 uppercase font-semibold">Total Loss Value</p>
                    <p className="text-xl font-bold text-red-700">{totalValueLost.toFixed(2)} JOD</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(summaryByReason).map(([reason, stats]) => (
                    <div key={reason} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold text-slate-900">{reason}</h3>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Occurrences</span>
                                <span className="font-medium">{stats.count}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Total Quantity</span>
                                <span className="font-medium">{stats.quantity.toFixed(2)} units</span>
                            </div>
                            <div className="pt-2 border-t border-slate-100 flex justify-between">
                                <span className="font-semibold text-slate-700">Cost Impact</span>
                                <span className="font-bold text-red-600">{stats.value.toFixed(2)} JOD</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-semibold text-slate-800">Recent Waste Logs</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Product</th>
                                <th className="px-6 py-3">Reason / Details</th>
                                <th className="px-6 py-3">Qty</th>
                                <th className="px-6 py-3">Cost</th>
                                <th className="px-6 py-3">User</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {transactions.map(tx => (
                                <tr key={tx.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-3 text-slate-500">
                                        {new Date(tx.timestamp).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-3 font-medium text-slate-900">
                                        {tx.product.name}
                                    </td>
                                    <td className="px-6 py-3 text-slate-600">
                                        {tx.notes}
                                    </td>
                                    <td className="px-6 py-3 font-mono text-red-600">
                                        -{tx.quantity}
                                    </td>
                                    <td className="px-6 py-3 text-slate-900">
                                        {((tx.quantity * tx.product.cost)).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-3 text-slate-500">
                                        {tx.user?.name || 'System'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
