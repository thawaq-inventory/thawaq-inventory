'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle,
    XCircle,
    Clock,
    DollarSign,
    Edit2,
    Loader2,
    AlertCircle
} from "lucide-react";

interface PayrollTransaction {
    id: string;
    employee: {
        id: string;
        name: string;
        username: string;
    };
    totalHours: number;
    hourlyRate: number;
    finalAmount: number;
    periodStart: string;
    periodEnd: string;
    status: string;
    transactionId: string | null;
    reference: string | null;
    errorMessage: string | null;
    createdAt: string;
    accountNumber: string | null;
    glStatus: string;
}

export default function PayrollApprovalsPage() {
    const [transactions, setTransactions] = useState<PayrollTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('waiting_bank_approval');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editAmount, setEditAmount] = useState<number>(0);

    useEffect(() => {
        fetchTransactions();
    }, [filter]);

    async function fetchTransactions() {
        try {
            setLoading(true);
            const url = filter === 'all'
                ? '/api/payroll/initiate'
                : `/api/payroll/initiate?status=${filter}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                setTransactions(data.transactions || []);
            }
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleApprove(transaction: PayrollTransaction) {
        if (!confirm(`Approve payment of ${transaction.finalAmount.toFixed(2)} JOD to ${transaction.employee.name}?`)) {
            return;
        }

        try {
            // In a real implementation, this would call the bank API to approve
            // For now, we'll just update the status locally
            alert('In production: This would approve the transaction in the Bank al Etihad app.\n\nFor now, transactions must be approved directly in the bank mobile app.');

            // Refresh list
            await fetchTransactions();
        } catch (error) {
            console.error('Failed to approve:', error);
            alert('Failed to approve transaction');
        }
    }

    async function handleReject(id: string) {
        if (!confirm('Are you sure you want to reject this payment request?')) {
            return;
        }

        try {
            const response = await fetch(`/api/payroll/transactions/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                alert('Transaction rejected successfully');
                await fetchTransactions();
            }
        } catch (error) {
            console.error('Failed to reject:', error);
            alert('Failed to reject transaction');
        }
    }

    function startEdit(transaction: PayrollTransaction) {
        setEditingId(transaction.id);
        setEditAmount(transaction.finalAmount);
    }

    async function saveEdit(id: string) {
        try {
            // In a real implementation, this would update the transaction amount
            alert(`Amount would be updated to ${editAmount.toFixed(2)} JOD`);
            setEditingId(null);
            await fetchTransactions();
        } catch (error) {
            console.error('Failed to update:', error);
        }
    }

    function getStatusBadge(status: string) {
        switch (status) {
            case 'waiting_bank_approval':
                return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
            case 'approved':
                return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
            case 'rejected':
                return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
            case 'failed':
                return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    }

    async function handlePostToGL() {
        const approvedIds = transactions
            .filter(t => t.status === 'approved' && t.glStatus === 'PENDING')
            .map(t => t.id);

        if (approvedIds.length === 0) return;

        if (!confirm(`Post ${approvedIds.length} approved payroll transactions to General Ledger?`)) return;

        try {
            const res = await fetch('/api/payroll/post-gl', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payrollIds: approvedIds })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Successfully posted to GL! Journal Entry ID: ${data.journalEntryId}`);
                fetchTransactions();
            } else {
                alert('Failed: ' + data.error);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to post to GL');
        }
    }

    const pendingCount = transactions.filter(t => t.status === 'waiting_bank_approval').length;
    const pendingGLCount = transactions.filter(t => t.status === 'approved' && t.glStatus === 'PENDING').length;

    return (
        <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <DollarSign className="w-8 h-8 text-green-600" />
                            Payroll Approvals
                        </h1>
                        <p className="text-slate-600 mt-2">
                            Review and approve CliQ instant transfer requests
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {pendingGLCount > 0 && (
                            <Button onClick={handlePostToGL} className="bg-purple-600 hover:bg-purple-700">
                                <DollarSign className="w-4 h-4 mr-2" />
                                Post {pendingGLCount} to GL
                            </Button>
                        )}
                        {pendingCount > 0 && (
                            <Badge className="bg-yellow-500 text-lg px-4 py-2">
                                {pendingCount} Pending
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="flex gap-2">
                        <Button
                            variant={filter === 'waiting_bank_approval' ? 'default' : 'outline'}
                            onClick={() => setFilter('waiting_bank_approval')}
                        >
                            <Clock className="w-4 h-4 mr-2" />
                            Pending ({transactions.filter(t => t.status === 'waiting_bank_approval').length})
                        </Button>
                        <Button
                            variant={filter === 'approved' ? 'default' : 'outline'}
                            onClick={() => setFilter('approved')}
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approved
                        </Button>
                        <Button
                            variant={filter === 'rejected' ? 'default' : 'outline'}
                            onClick={() => setFilter('rejected')}
                        >
                            <XCircle className="w-4 h-4 mr-2" />
                            Rejected
                        </Button>
                        <Button
                            variant={filter === 'all' ? 'default' : 'outline'}
                            onClick={() => setFilter('all')}
                        >
                            All
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Transactions List */}
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : transactions.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <DollarSign className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">No transactions found</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {transactions.map((transaction) => (
                        <Card key={transaction.id} className="overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    {/* Left: Employee Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <h3 className="text-xl font-bold">{transaction.employee.name}</h3>
                                            {getStatusBadge(transaction.status)}
                                            {transaction.glStatus === 'POSTED' && (
                                                <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">
                                                    GL Posted
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">Hours:</span>
                                                <span className="ml-2 font-medium">{transaction.totalHours.toFixed(1)} hrs</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Rate:</span>
                                                <span className="ml-2 font-medium">{transaction.hourlyRate} JOD/hr</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Period:</span>
                                                <span className="ml-2 font-medium">
                                                    {new Date(transaction.periodStart).toLocaleDateString()} - {new Date(transaction.periodEnd).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">CliQ Alias:</span>
                                                <span className="ml-2 font-medium">{transaction.accountNumber || 'Not provided'}</span>
                                            </div>
                                        </div>

                                        {transaction.errorMessage && (
                                            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                                <AlertCircle className="w-4 h-4 inline mr-1" />
                                                {transaction.errorMessage}
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Amount & Actions */}
                                    <div className="ml-6 text-right">
                                        {editingId === transaction.id ? (
                                            <div className="space-y-2">
                                                <Input
                                                    type="number"
                                                    value={editAmount}
                                                    onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)}
                                                    className="w-32 text-right"
                                                    step="0.1"
                                                />
                                                <div className="flex gap-2">
                                                    <Button size="sm" onClick={() => saveEdit(transaction.id)}>
                                                        Save
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="text-3xl font-bold text-green-600 mb-2">
                                                    {transaction.finalAmount.toFixed(2)} JOD
                                                </div>
                                                <div className="text-xs text-muted-foreground mb-3">
                                                    Created: {new Date(transaction.createdAt).toLocaleDateString()}
                                                </div>
                                            </>
                                        )}

                                        {transaction.status === 'waiting_bank_approval' && editingId !== transaction.id && (
                                            <div className="flex flex-col gap-2">
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={() => handleApprove(transaction)}
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => startEdit(transaction)}
                                                >
                                                    <Edit2 className="w-4 h-4 mr-1" />
                                                    Modify
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleReject(transaction.id)}
                                                >
                                                    <XCircle className="w-4 h-4 mr-1" />
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
