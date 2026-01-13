'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface Mapping {
    id: string;
    eventKey: string;
    description: string;
    accountId: string;
    account: {
        id: string;
        code: string;
        name: string;
    };
}

interface Account {
    id: string;
    code: string;
    name: string;
    type: string;
}

export default function AccountingSettingsPage() {
    const [mappings, setMappings] = useState<Mapping[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/accounting/settings');
            const data = await res.json();
            setMappings(data.mappings);
            setAccounts(data.accounts);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAccountChange = (eventKey: string, newAccountId: string) => {
        setMappings(prev => prev.map(m =>
            m.eventKey === eventKey ? { ...m, accountId: newAccountId } : m
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch('/api/accounting/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mappings: mappings.map(m => ({ eventKey: m.eventKey, accountId: m.accountId }))
                })
            });
            alert('Settings Saved');
        } catch (e) {
            alert('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Accounting Configuration</h1>
                    <p className="text-slate-500">Map System Events to Chart of Accounts</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                        <tr>
                            <th className="px-6 py-3">System Event</th>
                            <th className="px-6 py-3">Description</th>
                            <th className="px-6 py-3">Mapped Account</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {mappings.map(m => (
                            <tr key={m.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-mono text-slate-600">{m.eventKey}</td>
                                <td className="px-6 py-4 text-slate-900">{m.description}</td>
                                <td className="px-6 py-4">
                                    <select
                                        value={m.accountId}
                                        onChange={(e) => handleAccountChange(m.eventKey, e.target.value)}
                                        className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.code} - {acc.name} ({acc.type})
                                            </option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
