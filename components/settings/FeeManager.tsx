
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

interface PaymentMethod {
    id: string;
    name: string;
    feeRate: number;
}

export function FeeManager() {
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [newRate, setNewRate] = useState('');
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        fetchFees();
    }, []);

    const fetchFees = async () => {
        try {
            const res = await fetch('/api/settings/fees');
            if (res.ok) {
                const data = await res.json();
                setMethods(data);
            }
        } catch (error) {
            console.error('Failed to fetch fees', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (method: PaymentMethod, newRateValue?: number) => {
        setSaving(method.name);
        try {
            const rateToSend = newRateValue !== undefined ? newRateValue : method.feeRate;

            const res = await fetch('/api/settings/fees', {
                method: 'POST',
                body: JSON.stringify({ name: method.name, feeRate: rateToSend }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                await fetchFees();
                setNewName('');
                setNewRate('');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(null);
        }
    };

    const handleCreate = async () => {
        if (!newName || !newRate) return;
        const rate = parseFloat(newRate) / 100; // Convert 25% to 0.25
        await handleSave({ id: 'new', name: newName, feeRate: rate });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Financial Configuration</h3>
            <p className="text-sm text-slate-500 mb-6">Manage transaction fees for different payment methods. These rates are applied during Sales Import.</p>

            {loading ? (
                <div className="text-center py-4">Loading settings...</div>
            ) : (
                <div className="space-y-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Payment Method</TableHead>
                                <TableHead>Fee Percentage (%)</TableHead>
                                <TableHead className="w-32">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {methods.map((m) => (
                                <TableRow key={m.id}>
                                    <TableCell className="font-medium">{m.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                defaultValue={(m.feeRate * 100).toFixed(2)}
                                                className="w-24"
                                                onBlur={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    if (!isNaN(val)) {
                                                        const decimal = val / 100;
                                                        if (decimal !== m.feeRate) {
                                                            handleSave(m, decimal);
                                                        }
                                                    }
                                                }}
                                            />
                                            <span className="text-slate-500">%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {saving === m.name && <span className="text-xs text-green-600">Saved</span>}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="border-t pt-4">
                        <h4 className="text-sm font-medium mb-3">Add New Method</h4>
                        <div className="flex gap-4 items-end">
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500">Method Name</label>
                                <Input
                                    placeholder="e.g. UberEats"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500">Fee Rate (%)</label>
                                <Input
                                    type="number"
                                    placeholder="e.g. 15"
                                    value={newRate}
                                    onChange={(e) => setNewRate(e.target.value)}
                                    className="w-24"
                                />
                            </div>
                            <Button
                                onClick={handleCreate}
                                disabled={!newName || !newRate || saving === 'new'}
                            >
                                {saving === 'new' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Method'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
