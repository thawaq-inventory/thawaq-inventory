'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, X, Save, BookOpen, AlertCircle } from "lucide-react";
import { useRouter } from 'next/navigation';

interface Account {
    id: string;
    code: string;
    name: string;
    type: string;
}

interface Branch {
    id: string;
    name: string;
    code: string;
}

interface JournalLine {
    accountId: string;
    debit: string;
    credit: string;
}

export default function JournalEntryPage() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string>('');

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [reference, setReference] = useState('');
    const [lines, setLines] = useState<JournalLine[]>([
        { accountId: '', debit: '0', credit: '0' },
        { accountId: '', debit: '0', credit: '0' }
    ]);
    const [loading, setLoading] = useState(false);

    // Accrual State
    const [isAccrual, setIsAccrual] = useState(false);
    const [installments, setInstallments] = useState(12);
    const [firstDate, setFirstDate] = useState('');
    const [accrualDebitAccount, setAccrualDebitAccount] = useState('');
    const [accrualCreditAccount, setAccrualCreditAccount] = useState('');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    (async () => {
                        try {
                            const res = await fetch('/api/accounting/accounts', { cache: 'no-store' });
                            if (res.ok) {
                                const data = await res.json();
                                setAccounts(data);
                            }
                        } catch (e) {
                            console.error("Failed to fetch accounts", e);
                        }
                    })(),
                    fetchBranches()
                ]);

                try {
                    const stored = localStorage.getItem('selectedBranch');
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        setSelectedBranchId(parsed.id);
                    }
                } catch (e) { }
            } catch (error) {
                console.error('Failed to load data', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const fetchAccounts = async () => {
        const response = await fetch('/api/accounting/accounts');
        const data = await response.json();
        setAccounts(data);
    };

    const fetchBranches = async () => {
        try {
            const response = await fetch('/api/accounting/branches');
            if (response.ok) {
                const data = await response.json();
                setBranches(data);
            }
        } catch (error) {
            console.error('Failed to fetch branches');
        }
    };

    const addLine = () => {
        setLines([...lines, { accountId: '', debit: '0', credit: '0' }]);
    };

    const removeLine = (index: number) => {
        if (lines.length <= 2) {
            alert('You must have at least 2 lines in a journal entry');
            return;
        }
        setLines(lines.filter((_, i) => i !== index));
    };

    const handleLineChange = (index: number, type: 'debit' | 'credit', value: string) => {
        const newLines = [...lines];
        const line = { ...newLines[index] };

        line[type] = value;

        // If entering a value > 0, zero out the other side
        if (value && parseFloat(value) > 0) {
            const otherType = type === 'debit' ? 'credit' : 'debit';
            line[otherType] = '0';
        }

        newLines[index] = line;
        setLines(newLines);
    };

    const calculateTotals = () => {
        const totalDebits = lines.reduce((sum, line) => sum + parseFloat(line.debit || '0'), 0);
        const totalCredits = lines.reduce((sum, line) => sum + parseFloat(line.credit || '0'), 0);
        const difference = totalDebits - totalCredits;
        return { totalDebits, totalCredits, difference, balanced: Math.abs(difference) < 0.01 };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { balanced, difference } = calculateTotals();

        if (!balanced) {
            alert(`Entry is not balanced! Difference: ${Math.abs(difference).toFixed(2)} JOD`);
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/accounting/journal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date,
                    description,
                    reference,
                    branchId: selectedBranchId || null,
                    lines: lines.map(line => ({
                        accountId: line.accountId,
                        debit: parseFloat(line.debit),
                        credit: parseFloat(line.credit)
                    })),
                    accrual: isAccrual ? {
                        installments,
                        firstDate,
                        debitAccountId: accrualDebitAccount,
                        creditAccountId: accrualCreditAccount
                    } : null
                }),
            });

            if (response.ok) {
                alert('Journal entry recorded successfully!');
                router.push('/admin/accounting/journal');
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to create journal entry');
            }
        } catch (error) {
            console.error('Failed to create journal entry:', error);
            alert('Failed to record journal entry');
        } finally {
            setLoading(false);
        }
    };

    const { totalDebits, totalCredits, difference, balanced } = calculateTotals();
    const getAccountLabel = (accountId: string) => {
        const account = accounts.find(a => a.id === accountId);
        return account ? `${account.code} - ${account.name}` : '';
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">New Journal Entry</h1>
                <p className="text-slate-500 mt-1">Record manual accounting transactions</p>
            </div>

            {accounts.length === 0 && (
                <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="flex items-center gap-3 pt-6">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        <div>
                            <p className="font-medium text-amber-900">No accounts found</p>
                            <p className="text-sm text-amber-700">
                                You need to create accounts in the Chart of Accounts before recording journal entries.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/admin/accounting/accounts')}
                            className="ml-auto"
                        >
                            Go to Accounts
                        </Button>
                    </CardContent>
                </Card>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Entry Details</CardTitle>
                        <CardDescription>Basic information about this journal entry</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Branch Selection */}
                        <div className="space-y-2 p-3 bg-slate-50/50 rounded-md border border-slate-100">
                            <Label className="text-slate-600">Branch Context</Label>
                            <Select
                                value={selectedBranchId || "global"}
                                onValueChange={(val) => setSelectedBranchId(val === "global" ? "" : val)}
                            >
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Select Branch (Optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="global">Global (Headquarters)</SelectItem>
                                    {branches.map((branch) => (
                                        <SelectItem key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Global entries are visible to everyone. Branch entries are specific to that location.
                            </div>
                        </div>

                        {/* Automated Accrual Section */}
                        <div className="col-span-3 mt-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-2 mb-4">
                                <input
                                    type="checkbox"
                                    id="isAccrual"
                                    className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-600"
                                    checked={isAccrual}
                                    onChange={(e) => setIsAccrual(e.target.checked)}
                                />
                                <Label htmlFor="isAccrual" className="text-slate-900 font-medium cursor-pointer">
                                    Distribute as Monthly Accrual / Amortization
                                </Label>
                            </div>

                            {isAccrual && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="space-y-2">
                                        <Label>Installments (Months)</Label>
                                        <Input
                                            type="number"
                                            min="2"
                                            max="60"
                                            value={installments}
                                            onChange={(e) => setInstallments(parseInt(e.target.value) || 2)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>First Distribution Date</Label>
                                        <Input
                                            type="date"
                                            value={firstDate}
                                            onChange={(e) => setFirstDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Monthly Debit Account</Label>
                                        <Select value={accrualDebitAccount} onValueChange={setAccrualDebitAccount}>
                                            <SelectTrigger className="bg-white">
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
                                    <div className="space-y-2">
                                        <Label>Monthly Credit Account</Label>
                                        <Select value={accrualCreditAccount} onValueChange={setAccrualCreditAccount}>
                                            <SelectTrigger className="bg-white">
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
                                    <div className="col-span-full text-xs text-slate-500">
                                        <p>
                                            This will immediately create the entry above, plus <strong>{installments} future entries</strong> starting {firstDate}.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Description *</Label>
                            <Input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Description of this transaction"
                                required
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Journal Lines</CardTitle>
                                <CardDescription>Add debit and credit entries (must balance)</CardDescription>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addLine}>
                                <Plus className="w-4 h-4 mr-1" />
                                Add Line
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">#</TableHead>
                                    <TableHead>Account</TableHead>
                                    <TableHead className="w-40">Debit</TableHead>
                                    <TableHead className="w-40">Credit</TableHead>
                                    <TableHead className="w-16"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lines.map((line, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="text-slate-500 font-medium">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={line.accountId}
                                                onValueChange={(value) => {
                                                    const newLines = [...lines];
                                                    newLines[index] = { ...newLines[index], accountId: value };
                                                    setLines(newLines);
                                                }}
                                                required
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select account" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {accounts.map(account => (
                                                        <SelectItem key={account.id} value={account.id}>
                                                            {account.code} - {account.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={line.debit}
                                                onChange={(e) => handleLineChange(index, 'debit', e.target.value)}
                                                className="font-mono"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={line.credit}
                                                onChange={(e) => handleLineChange(index, 'credit', e.target.value)}
                                                className="font-mono"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {lines.length > 2 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeLine(index)}
                                                    className="h-8 w-8 text-red-500 hover:bg-red-50"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}

                                <TableRow className="bg-slate-50 font-semibold">
                                    <TableCell colSpan={2} className="text-right">
                                        Totals:
                                    </TableCell>
                                    <TableCell className={`font-mono ${totalDebits > 0 ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                                        {totalDebits.toFixed(2)} JOD
                                    </TableCell>
                                    <TableCell className={`font-mono ${totalCredits > 0 ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                                        {totalCredits.toFixed(2)} JOD
                                    </TableCell>
                                    <TableCell></TableCell>
                                </TableRow>

                                {!balanced && (
                                    <TableRow className="bg-red-50">
                                        <TableCell colSpan={2} className="text-right text-red-700 font-medium">
                                            Difference:
                                        </TableCell>
                                        <TableCell colSpan={3} className="font-mono text-red-700 font-bold">
                                            {Math.abs(difference).toFixed(2)} JOD {difference > 0 ? '(excess debit)' : '(excess credit)'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="text-sm font-medium text-blue-900 mb-2">Double-Entry Accounting</h4>
                            <p className="text-xs text-blue-700">
                                Every transaction must have equal debits and credits. Each line should have either a debit OR credit value (not both).
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading || !balanced || accounts.length === 0}
                        className="btn-success-green"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? 'Saving...' : 'Save Entry'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
