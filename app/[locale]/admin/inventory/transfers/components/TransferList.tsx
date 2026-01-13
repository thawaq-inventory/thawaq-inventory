'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    ArrowRight,
    CheckCircle2,
    Truck,
    Package
} from "lucide-react";
import { useRouter } from 'next/navigation';

interface TransferListProps {
    transfers: any[];
    loading: boolean;
    currentUserId: string;
    currentBranchId: string;
    refreshData: () => void;
}

export default function TransferList({
    transfers,
    loading,
    currentUserId,
    currentBranchId,
    refreshData
}: TransferListProps) {
    const router = useRouter();
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAction = async (transferId: string, action: 'send' | 'receive') => {
        setActionLoading(transferId);
        setError(null);

        try {
            const res = await fetch(`/api/transfers/${transferId}/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || `Failed to ${action} transfer`);
            }

            refreshData();
        } catch (err: any) {
            setError(err.message);
            // Auto-clear error after 5s
            setTimeout(() => setError(null), 5000);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (transfers.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No transfers found</h3>
                <p className="text-gray-500">There are no transfer requests matching your filter.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Reference</TableHead>
                            <TableHead>Route</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transfers.map((transfer) => {
                            const isIncoming = transfer.toBranchId === currentBranchId;
                            const isOutgoing = transfer.fromBranchId === currentBranchId;

                            return (
                                <TableRow key={transfer.id}>
                                    <TableCell className="font-mono text-xs">
                                        {transfer.id.slice(0, 8)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className={isOutgoing ? "font-semibold text-blue-700" : "text-gray-600"}>
                                                {transfer.fromBranch.name}
                                            </span>
                                            <ArrowRight className="w-4 h-4 text-gray-400" />
                                            <span className={isIncoming ? "font-semibold text-green-700" : "text-gray-600"}>
                                                {transfer.toBranch.name}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            <span className="font-medium">{transfer.items.length} items</span>
                                            <div className="text-xs text-gray-500 mt-1 max-w-[200px] truncate">
                                                {transfer.items.map((i: any) => `${i.product.name} (${i.quantity})`).join(', ')}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={transfer.status} />
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-500">
                                        {format(new Date(transfer.createdAt), 'MMM d, h:mm a')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {/* Action Logic */}
                                        {actionLoading === transfer.id ? (
                                            <Button disabled size="sm" variant="outline">
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                Processing
                                            </Button>
                                        ) : (
                                            <>
                                                {/* SEND Action: Only visible to sender when Requested */}
                                                {transfer.status === 'REQUESTED' && isOutgoing && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleAction(transfer.id, 'send')}
                                                        className="bg-blue-600 hover:bg-blue-700"
                                                    >
                                                        <Truck className="w-4 h-4 mr-2" />
                                                        Send
                                                    </Button>
                                                )}

                                                {/* RECEIVE Action: Only visible to receiver when In Transit */}
                                                {transfer.status === 'IN_TRANSIT' && isIncoming && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleAction(transfer.id, 'receive')}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                                        Receive
                                                    </Button>
                                                )}

                                                {/* No actions for other states or incorrect users */}
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'REQUESTED':
            return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Requested</Badge>;
        case 'IN_TRANSIT':
            return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Transit</Badge>;
        case 'RECEIVED':
            return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">Received</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
}
