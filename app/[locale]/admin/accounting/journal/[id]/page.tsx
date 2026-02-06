'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Printer } from "lucide-react";
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { use } from 'react';

interface JournalEntry {
    id: string;
    date: string;
    description: string;
    reference: string | null;
    lines: {
        id: string;
        debit: number;
        credit: number;
        account: {
            code: string;
            name: string;
            type: string;
        };
    }[];
}

export default function JournalEntryDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [entry, setEntry] = useState<JournalEntry | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEntry = async () => {
            try {
                // Fetch all and filter (not ideal but works for now as we don't have single GET logic exposed cleanly yet or we can use existing list API)
                // Actually we checked route.ts and it DOES NOT have a single GET handler for /[id] yet!
                // Wait, I saw `app/api/accounting/journal/route.ts` which has GET (all) and POST.
                // I DO NOT see `app/api/accounting/journal/[id]/route.ts`.
                // So I need to fetch all and find, OR implement the API route.
                // Fetching all is inefficient. I should probably implement the API Details route too.
                // But specifically for this "Fix 404" task, I can just fetch the list and find it if the list isn't huge.
                // BETTER: I will assume I'll fix the API to support single GET or just implement it here for now.
                // Let's implement dynamic fetching from the list endpoint filtering by ID if possible? No, the list endpoint returns everything.
                // I will add the [id] route logic in the next step. For now, let's assume the component is ready to consume it.

                const response = await fetch(`/api/accounting/journal/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setEntry(data);
                } else {
                    console.error('Failed to fetch journal entry');
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEntry();
    }, [id]);

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading entry details...</div>;
    }

    if (!entry) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500 mb-4">Journal Entry not found.</p>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
            </div>
        );
    }

    const totalDebits = entry.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredits = entry.lines.reduce((sum, line) => sum + line.credit, 0);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Entry {entry.reference || `#${entry.id.substring(0, 8)}`}
                </h1>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>{entry.description}</CardTitle>
                            <CardDescription>
                                Date: {format(new Date(entry.date), 'PPP')}
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => window.print()}>
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Account</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Debit</TableHead>
                                <TableHead className="text-right">Credit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entry.lines.map((line) => (
                                <TableRow key={line.id}>
                                    <TableCell>
                                        <div className="font-medium">{line.account.code} - {line.account.name}</div>
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-sm">{line.account.type}</TableCell>
                                    <TableCell className="text-right font-mono">
                                        {line.debit > 0 ? line.debit.toFixed(2) : '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {line.credit > 0 ? line.credit.toFixed(2) : '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                            <TableRow className="bg-slate-50 font-bold">
                                <TableCell colSpan={2} className="text-right">Totals</TableCell>
                                <TableCell className="text-right">{totalDebits.toFixed(2)}</TableCell>
                                <TableCell className="text-right">{totalCredits.toFixed(2)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
