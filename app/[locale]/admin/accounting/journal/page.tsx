'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, ArrowUpDown, Trash2, RefreshCcw } from "lucide-react";
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

import { SalesTransactionModal } from '@/components/accounting/SalesTransactionModal';
import { DeleteConfirmationModal } from '@/components/accounting/DeleteConfirmationModal';

interface JournalEntry {
    id: string;
    date: Date;
    description: string;
    reference: string | null;
    lines: {
        debit: number;
        credit: number;
        account: {
            code: string;
            name: string;
            type: string;
        };
    }[];
    expense?: { id: string };
    payrollTransaction?: { id: string };
    branch?: { name: string };
}

export default function JournalEntriesPage() {
    const router = useRouter();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAll, setShowAll] = useState(false);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Modal State
    const [selectedSalesEntry, setSelectedSalesEntry] = useState<JournalEntry | null>(null);
    const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);

    // Delete Modal State
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteEntry, setDeleteEntry] = useState<JournalEntry | null>(null); // Store full entry for logic
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [debugInfo, setDebugInfo] = useState<string>('');
    const [rawError, setRawError] = useState<string>('');

    useEffect(() => {
        // Initial fetch
        fetchEntries();

        // Listen for branch changes
        const handleBranchChange = () => fetchEntries();
        window.addEventListener('branch-change', handleBranchChange);

        return () => {
            window.removeEventListener('branch-change', handleBranchChange);
        };
    }, []);

    const fetchEntries = async () => {
        try {
            setLoading(true);
            let branchId = '';
            try {
                const stored = localStorage.getItem('selectedBranch');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    branchId = parsed.id;
                }
            } catch (e) { }

            const query = branchId ? `?branchId=${branchId}` : '';
            const url = `/api/accounting/journal${query}`;

            setDebugInfo(`Fetching: ${url} | BranchCtx: ${branchId || 'None'}`);
            console.log('Fetching Journal with query:', query);

            const response = await fetch(url, { cache: 'no-store' });

            if (!response.ok) {
                const txt = await response.text();
                throw new Error(`Status ${response.status}: ${txt}`);
            }

            const data = await response.json();

            console.log('fetched journal entries count:', data.length);
            setDebugInfo(prev => prev + ` | Count: ${data.length}`);

            setEntries(data);
            setRawError('');
        } catch (error: any) {
            console.error('Failed to fetch journal entries:', error);
            setRawError(error.message || 'Unknown Error');
            setDebugInfo(prev => prev + ` | Failed`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (entry: JournalEntry) => {
        setDeleteId(entry.id);
        setDeleteEntry(entry);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteId || !deleteEntry) return;

        setIsDeleting(true);

        try {
            let res;

            // SMART DELETE LOGIC
            // 1. Expense Claim
            if (deleteEntry.expense?.id) {
                // TODO: Ensure DELETE /api/expenses logic exists or handle here. 
                // For now, let's assume we delete the journal entry directly if no specific endpoint.
                // Or better, let's assume the user wants to delete the transaction.
                res = await fetch(`/api/accounting/journal/${deleteId}`, { method: 'DELETE' });
            }
            // 2. Sales Import
            else if (deleteEntry.description.includes('Sales Import') && deleteEntry.reference) {
                res = await fetch(`/api/inventory/sales-import/${deleteEntry.reference}`, { method: 'DELETE' });
            }
            // 3. Standard Manual Entry
            else {
                res = await fetch(`/api/accounting/journal/${deleteId}`, { method: 'DELETE' });
            }

            if (res.ok) {
                // Remove locally
                setEntries(prev => prev.filter(e => e.id !== deleteId));
                setIsDeleteModalOpen(false);
                setDeleteId(null);
                setDeleteEntry(null);
            } else {
                const data = await res.json();
                alert('Failed to delete: ' + (data.error || 'Unknown error'));
                // Keep modal open
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete entry');
        } finally {
            setIsDeleting(false);
        }
    };

    const filterAndSortEntries = () => {
        let filtered = [...entries];

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(entry =>
                entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.reference?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Sort by date
        filtered.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

        // Limit to 10 if not showing all
        if (!showAll) {
            filtered = filtered.slice(0, 10);
        }

        setFilteredEntries(filtered);
    };

    const calculateTotal = (entry: JournalEntry) => {
        return entry.lines.reduce((sum, line) => sum + line.debit, 0);
    };

    const toggleSort = () => {
        setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    };

    const handleRowClick = (entry: JournalEntry) => {
        // Rule 1: Expense Claim
        if (entry.expense?.id) {
            router.push(`/admin/expenses/${entry.expense.id}`);
            return;
        }

        // Rule 2: Sales Import (Pop-up)
        if (entry.description.includes('Sales Import')) {
            setSelectedSalesEntry(entry);
            setIsSalesModalOpen(true);
            return;
        }

        // Rule 3: Payroll (Optional Future Expansion)
        // if (entry.payrollTransaction?.id) ...

        // Rule 4: Manual / Default
        router.push(`/admin/accounting/journal/${entry.id}`);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* DEBUG PANEL */}
            <div className="bg-slate-100 p-2 text-xs font-mono border border-slate-300 rounded text-slate-700">
                <strong>DEBUG:</strong> {debugInfo}
                {rawError && <span className="text-red-600 block">ERROR: {rawError}</span>}
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Journal Entries</h1>
                    <p className="text-slate-500 mt-1">View and manage accounting journal entries</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchEntries} disabled={loading}>
                        <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => router.push('/admin/accounting/journal/new')}
                        className="btn-primary-blue"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Entry
                    </Button>
                </div>
            </div>

            <Card className="card-accent-blue">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Recent Entries</CardTitle>
                            <CardDescription>
                                {showAll ? 'All journal entries' : 'Last 10 journal entries'}
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 w-64"
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAll(!showAll)}
                            >
                                {showAll ? 'Show Recent' : 'View All'}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-slate-500">Loading...</div>
                    ) : filteredEntries.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-slate-500 mb-4">No journal entries found</p>
                            <Button
                                variant="outline"
                                onClick={() => router.push('/admin/accounting/journal/new')}
                            >
                                Create Your First Entry
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-32">
                                        <button
                                            onClick={toggleSort}
                                            className="flex items-center gap-1 hover:text-slate-900"
                                        >
                                            Date
                                            <ArrowUpDown className="w-3 h-3" />
                                        </button>
                                    </TableHead>
                                    <TableHead className="w-32">Reference</TableHead>
                                    <TableHead className="w-32">Branch</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Accounts</TableHead>
                                    <TableHead className="text-right w-32">Amount</TableHead>
                                    <TableHead className="w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEntries.map((entry) => (
                                    <TableRow
                                        key={entry.id}
                                        className="cursor-pointer hover:bg-slate-50"
                                        onClick={() => handleRowClick(entry)}
                                    >
                                        <TableCell className="font-medium">
                                            {format(new Date(entry.date), 'MMM dd, yyyy')}
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            {entry.reference || '-'}
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600">
                                            {entry.branch ? entry.branch.name : 'Global/HQ'}
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-900">
                                            {entry.description}
                                            {new Date(entry.date) > new Date() && (
                                                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                                                    Scheduled
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600">
                                            {entry.lines.slice(0, 2).map((line, idx) => (
                                                <div key={idx}>
                                                    {line.account.code} - {line.account.name}
                                                </div>
                                            ))}
                                            {entry.lines.length > 2 && (
                                                <div className="text-slate-400">
                                                    +{entry.lines.length - 2} more
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-medium text-sky-600">
                                            {calculateTotal(entry).toFixed(2)} JOD
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-slate-400 hover:text-red-600 hover:bg-red-50 z-10 relative"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleDeleteClick(entry);
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <SalesTransactionModal
                isOpen={isSalesModalOpen}
                onClose={() => setIsSalesModalOpen(false)}
                entry={selectedSalesEntry}
            />

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Journal Entry?"
                description={deleteEntry?.description.includes('Sales')
                    ? "REVERSAL WARNING: This will reverse the entire Sales Upload (Revenue, Tax, Fees, Inventory). This cannot be undone."
                    : "This will permanently delete the transaction and reverse all GL impacts. This cannot be undone."}
                isLoading={isDeleting}
            />
        </div>
    );
}
