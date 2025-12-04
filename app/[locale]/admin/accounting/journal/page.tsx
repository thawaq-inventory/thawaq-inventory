'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, ArrowUpDown } from "lucide-react";
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

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
        };
    }[];
}

export default function JournalEntriesPage() {
    const router = useRouter();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAll, setShowAll] = useState(false);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        fetchEntries();
    }, []);

    useEffect(() => {
        filterAndSortEntries();
    }, [entries, searchTerm, showAll, sortOrder]);

    const fetchEntries = async () => {
        try {
            const response = await fetch('/api/accounting/journal');
            const data = await response.json();
            setEntries(data);
        } catch (error) {
            console.error('Failed to fetch journal entries:', error);
        } finally {
            setLoading(false);
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

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Journal Entries</h1>
                    <p className="text-slate-500 mt-1">View and manage accounting journal entries</p>
                </div>
                <Button
                    onClick={() => router.push('/admin/accounting/journal/new')}
                    className="btn-primary-blue"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Entry
                </Button>
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
                                    <TableHead>Description</TableHead>
                                    <TableHead>Accounts</TableHead>
                                    <TableHead className="text-right w-32">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEntries.map((entry) => (
                                    <TableRow
                                        key={entry.id}
                                        className="cursor-pointer hover:bg-slate-50"
                                        onClick={() => router.push(`/admin/accounting/journal/${entry.id}`)}
                                    >
                                        <TableCell className="font-medium">
                                            {format(new Date(entry.date), 'MMM dd, yyyy')}
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            {entry.reference || '-'}
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-900">
                                            {entry.description}
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
