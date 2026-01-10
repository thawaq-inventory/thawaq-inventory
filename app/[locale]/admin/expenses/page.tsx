'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Receipt, CheckCircle, XCircle, Edit, Eye, Clock, DollarSign } from "lucide-react";
import Image from 'next/image';

interface Expense {
    id: string;
    amount: number;
    taxRate: number;
    taxAmount: number;
    totalAmount: number;
    description: string | null;
    expenseDate: string;
    photoUrl: string;
    notes: string | null;
    customCategory: string | null;
    status: string;
    category: { name: string } | null;
    submittedBy: { name: string };
    debitAccount: { name: string; code: string } | null;
    creditAccount: { name: string; code: string } | null;
    debitAccountId: string | null;
    creditAccountId: string | null;
    createdAt: string;
}

interface Account {
    id: string;
    code: string;
    name: string;
    type: string;
}

export default function AdminExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Editable fields
    const [editAmount, setEditAmount] = useState(0);
    const [editTaxRate, setEditTaxRate] = useState(0);
    const [editCustomTaxRate, setEditCustomTaxRate] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editDebitAccountId, setEditDebitAccountId] = useState('');
    const [editCreditAccountId, setEditCreditAccountId] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');

    // Calculate tax from edited values
    const finalTaxRate = editTaxRate === 999 ? (parseFloat(editCustomTaxRate) || 0) : editTaxRate;
    const editTaxAmount = editAmount * (finalTaxRate / 100);
    const editTotalAmount = editAmount + editTaxAmount;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [expensesRes, accountsRes] = await Promise.all([
                fetch('/api/expenses?status=PENDING'),
                fetch('/api/accounting/accounts'),
            ]);
            const expensesData = await expensesRes.json();
            const accountsData = await accountsRes.json();
            setExpenses(expensesData);
            setAccounts(accountsData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const openExpense = (expense: Expense) => {
        setSelectedExpense(expense);
        setEditAmount(expense.amount);
        const isCustomRate = expense.taxRate > 0 && ![5, 10, 16].includes(expense.taxRate);
        setEditTaxRate(isCustomRate ? 999 : (expense.taxRate || 0));
        setEditCustomTaxRate(isCustomRate ? expense.taxRate.toString() : '');
        setEditDescription(expense.description || '');
        setEditDebitAccountId(expense.debitAccountId || '');
        setEditCreditAccountId(expense.creditAccountId || '');
        setRejectionReason('');
    };

    const handleApprove = async () => {
        if (!selectedExpense) return;

        if (!editDebitAccountId || !editCreditAccountId) {
            alert('Please select both debit and credit accounts');
            return;
        }

        setProcessing(true);
        try {
            // Get current user ID
            const meRes = await fetch('/api/auth/me');
            const meData = await meRes.json();
            const userId = meData.id;

            // Update expense first if edited
            if (
                editAmount !== selectedExpense.amount ||
                editDescription !== selectedExpense.description ||
                editDebitAccountId !== selectedExpense.debitAccountId ||
                editCreditAccountId !== selectedExpense.creditAccountId
            ) {
                await fetch(`/api/expenses/${selectedExpense.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: editAmount,
                        description: editDescription,
                        debitAccountId: editDebitAccountId,
                        creditAccountId: editCreditAccountId,
                    }),
                });
            }

            // Approve and create journal entry
            await fetch(`/api/expenses/${selectedExpense.id}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reviewedById: userId,
                    debitAccountId: editDebitAccountId,
                    creditAccountId: editCreditAccountId,
                }),
            });

            setSelectedExpense(null);
            fetchData();
        } catch (error) {
            console.error('Error approving expense:', error);
            alert('Failed to approve expense');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedExpense) return;

        setProcessing(true);
        try {
            // Get current user ID
            const meRes = await fetch('/api/auth/me');
            const meData = await meRes.json();
            const userId = meData.id;

            await fetch(`/api/expenses/${selectedExpense.id}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reviewedById: userId,
                    rejectionReason,
                }),
            });

            setSelectedExpense(null);
            fetchData();
        } catch (error) {
            console.error('Error rejecting expense:', error);
            alert('Failed to reject expense');
        } finally {
            setProcessing(false);
        }
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
                    <h1 className="text-3xl font-bold text-slate-900">Expense Approvals</h1>
                    <p className="text-slate-500 mt-1">Review and approve employee expenses</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">{expenses.length} Pending</span>
                </div>
            </div>

            {/* Expenses List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {expenses.map((expense) => (
                    <Card key={expense.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-lg">
                                        {expense.category?.name || expense.customCategory || 'Uncategorized'}
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        Submitted by {expense.submittedBy.name}
                                    </CardDescription>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {(expense.totalAmount || expense.amount).toFixed(2)} JOD
                                    </div>
                                    {expense.taxRate > 0 && (
                                        <div className="text-xs text-slate-500 mt-1">
                                            +{expense.taxRate}% tax
                                        </div>
                                    )}
                                    <div className="text-xs text-slate-500 mt-1">
                                        {new Date(expense.expenseDate).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {expense.description && (
                                <p className="text-sm text-slate-600">{expense.description}</p>
                            )}

                            {/* Receipt Preview */}
                            <div className="relative h-48 bg-slate-100 rounded-lg overflow-hidden">
                                <Image
                                    src={expense.photoUrl}
                                    alt="Receipt"
                                    fill
                                    className="object-contain"
                                />
                            </div>

                            <Button
                                onClick={() => openExpense(expense)}
                                className="w-full bg-gradient-to-r from-blue-500 to-blue-600"
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Review & Approve
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {expenses.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Receipt className="w-16 h-16 text-slate-300 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Pending Expenses</h3>
                        <p className="text-slate-500">All expenses have been reviewed</p>
                    </CardContent>
                </Card>
            )}

            {/* Review Modal */}
            {selectedExpense && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <CardHeader>
                            <CardTitle>Review Expense</CardTitle>
                            <CardDescription>
                                Edit details and select accounts before approving
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Receipt Photo */}
                            <div>
                                <Label>Receipt Photo</Label>
                                <div className="relative h-64 bg-slate-100 rounded-lg overflow-hidden mt-2">
                                    <Image
                                        src={selectedExpense.photoUrl}
                                        alt="Receipt"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            </div>

                            {/* Amount & Tax */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Amount (JOD)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={editAmount}
                                        onChange={(e) => setEditAmount(parseFloat(e.target.value))}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label>Tax Rate</Label>
                                    <select
                                        value={editTaxRate}
                                        onChange={(e) => setEditTaxRate(parseFloat(e.target.value))}
                                        className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md"
                                    >
                                        <option value="0">0% (No Tax)</option>
                                        <option value="5">5%</option>
                                        <option value="10">10%</option>
                                        <option value="16">16%</option>
                                        <option value="999">Custom %</option>
                                    </select>
                                </div>
                            </div>

                            {/* Custom Tax Rate Input */}
                            {editTaxRate === 999 && (
                                <div>
                                    <Label>Custom Tax Rate (%) *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        max="16"
                                        value={editCustomTaxRate}
                                        onChange={(e) => setEditCustomTaxRate(e.target.value)}
                                        required
                                        placeholder="Enter rate (max 16%)"
                                        className="mt-1"
                                    />
                                </div>
                            )}

                            {/* Tax Summary */}
                            {editAmount > 0 && finalTaxRate > 0 && (
                                <div className="p-3 bg-blue-50 rounded-lg space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Base Amount:</span>
                                        <span className="font-medium">{editAmount.toFixed(2)} JOD</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Tax ({finalTaxRate}%):</span>
                                        <span className="font-medium">{editTaxAmount.toFixed(2)} JOD</span>
                                    </div>
                                    <div className="flex justify-between pt-1 border-t border-blue-200">
                                        <span className="font-semibold text-slate-900">Total Amount:</span>
                                        <span className="font-bold text-blue-600">{editTotalAmount.toFixed(2)} JOD</span>
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            <div>
                                <Label>Description</Label>
                                <Input
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    placeholder="Update description..."
                                    className="mt-1"
                                />
                            </div>

                            {/* Account Mapping */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Debit Account (Expense)</Label>
                                    <select
                                        value={editDebitAccountId}
                                        onChange={(e) => setEditDebitAccountId(e.target.value)}
                                        className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md"
                                    >
                                        <option value="">Select account...</option>
                                        {accounts.filter(a => a.type === 'EXPENSE').map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.code} - {account.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <Label>Credit Account (Cash/Payable)</Label>
                                    <select
                                        value={editCreditAccountId}
                                        onChange={(e) => setEditCreditAccountId(e.target.value)}
                                        className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md"
                                    >
                                        <option value="">Select account...</option>
                                        {accounts.filter(a => a.type === 'ASSET' || a.type === 'LIABILITY').map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.code} - {account.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Rejection Reason (shown if rejecting) */}
                            <div>
                                <Label>Rejection Reason (Optional)</Label>
                                <Input
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Reason for rejection..."
                                    className="mt-1"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedExpense(null)}
                                    className="flex-1"
                                    disabled={processing}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleReject}
                                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                                    disabled={processing}
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                </Button>
                                <Button
                                    onClick={handleApprove}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                                    disabled={processing}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve & Post
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
