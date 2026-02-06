'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, BookOpen } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface Account {
    id: string;
    code: string;
    name: string;
    type: string;
    description?: string;
    balance?: number;
}

const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

const ACCOUNT_TYPE_LABELS: { [key: string]: string } = {
    ASSET: 'Asset',
    LIABILITY: 'Liability',
    EQUITY: 'Equity',
    REVENUE: 'Revenue',
    EXPENSE: 'Expense'
};

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Account Dialog State
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        type: 'EXPENSE',
        description: ''
    });
    const [saving, setSaving] = useState(false);

    // Adjustment Dialog State
    const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
    const [adjustmentData, setAdjustmentData] = useState({
        description: '',
        amount: '',
        type: 'DEBIT', // DEBIT or CREDIT
        accountId: ''
    });

    useEffect(() => {
        fetchAccounts();

        const handleStorageChange = () => fetchAccounts();
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('branch-change', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('branch-change', handleStorageChange);
        };
    }, []);

    useEffect(() => {
        if (selectedAccount) {
            setFormData({
                code: selectedAccount.code,
                name: selectedAccount.name,
                type: selectedAccount.type,
                description: selectedAccount.description || ''
            });
        } else {
            setFormData({
                code: '',
                name: '',
                type: 'EXPENSE',
                description: ''
            });
        }
    }, [selectedAccount]);

    const fetchAccounts = async () => {
        try {
            let branchId = '';
            try {
                const stored = localStorage.getItem('selectedBranch');
                if (stored) branchId = JSON.parse(stored).id;
            } catch (e) { }

            const query = branchId ? `?branchId=${branchId}` : '';
            const response = await fetch(`/api/accounting/accounts${query}`);
            const data = await response.json();
            setAccounts(data);
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = selectedAccount
                ? `/api/accounting/accounts/${selectedAccount.id}`
                : '/api/accounting/accounts';
            const method = selectedAccount ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                fetchAccounts();
                setDialogOpen(false);
                setSelectedAccount(null);
            }
        } catch (error) {
            console.error('Failed to save account:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this account?')) return;
        try {
            const response = await fetch(`/api/accounting/accounts/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) fetchAccounts();
        } catch (error) {
            console.error('Failed to delete account:', error);
        }
    };

    const handleAdjustment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adjustmentData.accountId || !adjustmentData.amount) return;

        setSaving(true);
        // Get Branch ID
        let branchId = null;
        try {
            const stored = localStorage.getItem('selectedBranch');
            if (stored) branchId = JSON.parse(stored).id;
        } catch (e) { }

        try {
            const response = await fetch('/api/accounting/manual-entry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...adjustmentData,
                    amount: parseFloat(adjustmentData.amount),
                    branchId: branchId
                }),
            });

            if (response.ok) {
                fetchAccounts();
                setAdjustmentDialogOpen(false);
                setAdjustmentData({ description: '', amount: '', type: 'DEBIT', accountId: '' });
                alert('Adjustment posted successfully.');
            } else {
                const err = await response.json();
                alert(`Failed to post adjustment: ${err.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Adjustment error:', error);
        } finally {
            setSaving(false);
        }
    };

    const formatMoney = (amount: number = 0) => {
        return new Intl.NumberFormat('en-JO', {
            style: 'currency',
            currency: 'JOD'
        }).format(amount);
    };

    const filteredAccounts = accounts.filter(account =>
        account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const accountsByType = ACCOUNT_TYPES.reduce((acc, type) => {
        acc[type] = filteredAccounts.filter(a => a.type === type);
        return acc;
    }, {} as { [key: string]: Account[] });

    return (
        <div className="w-full max-w-[100vw] overflow-x-hidden mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Chart of Accounts</h1>
                    <p className="text-slate-500 mt-1">Manage accounts and manual adjustments</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        onClick={() => setAdjustmentDialogOpen(true)}
                        className="flex-1 sm:flex-none"
                    >
                        <Edit className="w-4 h-4 mr-2" />
                        Manual Adjustment
                    </Button>
                    <Button
                        onClick={() => {
                            setSelectedAccount(null);
                            setDialogOpen(true);
                        }}
                        className="bg-slate-900 hover:bg-slate-800 flex-1 sm:flex-none"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Account
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <Input
                                placeholder="Search accounts..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="text-center py-12 text-slate-500">Loading accounts...</div>
                    ) : accounts.length === 0 ? (
                        <div className="text-center py-12">
                            <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <h3 className="text-lg font-medium text-slate-900 mb-2">No accounts yet</h3>
                            <p className="text-slate-500 mb-4">Run system initialization to seed defaults.</p>
                            <Button
                                onClick={() => {
                                    setSelectedAccount(null);
                                    setDialogOpen(true);
                                }}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Account
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {ACCOUNT_TYPES.map(type => {
                                const typeAccounts = accountsByType[type];
                                if (!typeAccounts || typeAccounts.length === 0) return null;

                                return (
                                    <div key={type} className="p-6">
                                        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
                                            {ACCOUNT_TYPE_LABELS[type]}
                                        </h3>
                                        {/* Mobile Responsive Container */}
                                        <div className="w-full overflow-x-auto">
                                            <div className="min-w-[800px]">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="w-24">Code</TableHead>
                                                            <TableHead>Name</TableHead>
                                                            <TableHead className="text-right">Balance</TableHead>
                                                            <TableHead>Type</TableHead>
                                                            <TableHead>Description</TableHead>
                                                            <TableHead className="text-right w-32">Actions</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {typeAccounts.map((account) => (
                                                            <TableRow key={account.id}>
                                                                <TableCell className="font-mono text-sm font-medium">
                                                                    {account.code}
                                                                </TableCell>
                                                                <TableCell className="font-medium text-slate-900">
                                                                    {account.name}
                                                                </TableCell>
                                                                <TableCell className={`text-right font-medium ${account.balance && account.balance < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                                                                    {formatMoney(account.balance)}
                                                                </TableCell>
                                                                <TableCell className="text-slate-500 text-xs">
                                                                    {account.type}
                                                                </TableCell>
                                                                <TableCell className="text-slate-600 text-sm">
                                                                    {account.description || '-'}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <div className="flex justify-end gap-1">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => {
                                                                                setSelectedAccount(account);
                                                                                setDialogOpen(true);
                                                                            }}
                                                                            className="h-8 w-8 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                                                        >
                                                                            <Edit className="w-4 h-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => handleDelete(account.id)}
                                                                            className="h-8 w-8 text-slate-500 hover:bg-red-50 hover:text-red-600"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Account Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <form onSubmit={handleSave}>
                        <DialogHeader>
                            <DialogTitle>
                                {selectedAccount ? 'Edit Account' : 'Add Account'}
                            </DialogTitle>
                            <DialogDescription>
                                {selectedAccount
                                    ? 'Update account information'
                                    : 'Create a new account for your chart of accounts'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="code" className="text-right">
                                    Code *
                                </Label>
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    className="col-span-3"
                                    placeholder="1000, 4000, etc."
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Name *
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="col-span-3"
                                    placeholder="Cash, Sales, etc."
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="type" className="text-right">
                                    Type *
                                </Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ACCOUNT_TYPES.map(type => (
                                            <SelectItem key={type} value={type}>
                                                {ACCOUNT_TYPE_LABELS[type]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="description" className="text-right">
                                    Description
                                </Label>
                                <Input
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="col-span-3"
                                    placeholder="Optional description"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving ? 'Saving...' : 'Save Account'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Manual Adjustment Dialog */}
            <Dialog open={adjustmentDialogOpen} onOpenChange={setAdjustmentDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <form onSubmit={handleAdjustment}>
                        <DialogHeader>
                            <DialogTitle>Manual Adjustment</DialogTitle>
                            <DialogDescription>
                                Post a manual debit/credit to an account.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Account</Label>
                                <Select
                                    value={adjustmentData.accountId}
                                    onValueChange={(val) => setAdjustmentData({ ...adjustmentData, accountId: val })}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select Account" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {accounts.map(acc => (
                                            <SelectItem key={acc.id} value={acc.id}>
                                                {acc.code} - {acc.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Type</Label>
                                <Select
                                    value={adjustmentData.type}
                                    onValueChange={(val) => setAdjustmentData({ ...adjustmentData, type: val })}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DEBIT">Debit (Increase Asset/Expense)</SelectItem>
                                        <SelectItem value="CREDIT">Credit (Increase Liability/Revenue)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Amount</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={adjustmentData.amount}
                                    onChange={(e) => setAdjustmentData({ ...adjustmentData, amount: e.target.value })}
                                    className="col-span-3"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Note</Label>
                                <Input
                                    value={adjustmentData.description}
                                    onChange={(e) => setAdjustmentData({ ...adjustmentData, description: e.target.value })}
                                    className="col-span-3"
                                    placeholder="Reason for adjustment"
                                    required
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setAdjustmentDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving ? 'Posting...' : 'Post Adjustment'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
