'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Tag } from "lucide-react";

interface ExpenseCategory {
    id: string;
    name: string;
    description: string | null;
    debitAccount: { name: string; code: string } | null;
    creditAccount: { name: string; code: string } | null;
    debitAccountId: string | null;
    creditAccountId: string | null;
    _count: { expenses: number };
}

interface Account {
    id: string;
    code: string;
    name: string;
    type: string;
}

export default function ExpenseCategoriesPage() {
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [debitAccountId, setDebitAccountId] = useState('');
    const [creditAccountId, setCreditAccountId] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [categoriesRes, accountsRes] = await Promise.all([
                fetch('/api/expenses/categories'),
                fetch('/api/accounting/accounts'),
            ]);
            const categoriesData = await categoriesRes.json();
            const accountsData = await accountsRes.json();
            setCategories(categoriesData);
            setAccounts(accountsData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setName('');
        setDescription('');
        setDebitAccountId('');
        setCreditAccountId('');
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (category: ExpenseCategory) => {
        setName(category.name);
        setDescription(category.description || '');
        setDebitAccountId(category.debitAccountId || '');
        setCreditAccountId(category.creditAccountId || '');
        setEditingId(category.id);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingId ? '/api/expenses/categories' : '/api/expenses/categories';
            const method = editingId ? 'PUT' : 'POST';

            const body: any = {
                name,
                description,
                debitAccountId: debitAccountId || null,
                creditAccountId: creditAccountId || null,
            };

            if (editingId) {
                body.id = editingId;
            }

            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            resetForm();
            fetchData();
        } catch (error) {
            console.error('Error saving category:', error);
            alert('Failed to save category');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            await fetch(`/api/expenses/categories?id=${id}`, {
                method: 'DELETE',
            });
            fetchData();
        } catch (error) {
            console.error('Error deleting category:', error);
            alert('Failed to delete category');
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
                    <h1 className="text-3xl font-bold text-slate-900">Expense Categories</h1>
                    <p className="text-slate-500 mt-1">Manage categories and account mappings</p>
                </div>
                <Button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-blue-500 to-blue-600"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                </Button>
            </div>

            {/* Form */}
            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>{editingId ? 'Edit' : 'Add'} Category</CardTitle>
                        <CardDescription>Set default account mappings for this category</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Category Name *</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="e.g., Fuel, Supplies, Utilities"
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label>Description</Label>
                                <Input
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Optional description"
                                    className="mt-1"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Default Debit Account (Expense)</Label>
                                    <select
                                        value={debitAccountId}
                                        onChange={(e) => setDebitAccountId(e.target.value)}
                                        className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md"
                                    >
                                        <option value="">None (manual select)</option>
                                        {accounts.filter(a => a.type === 'EXPENSE').map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.code} - {account.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <Label>Default Credit Account (Cash/Payable)</Label>
                                    <select
                                        value={creditAccountId}
                                        onChange={(e) => setCreditAccountId(e.target.value)}
                                        className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md"
                                    >
                                        <option value="">None (manual select)</option>
                                        {accounts.filter(a => a.type === 'ASSET' || a.type === 'LIABILITY').map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.code} - {account.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={resetForm}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {editingId ? 'Update' : 'Create'} Category
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Categories List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categories.map((category) => (
                    <Card key={category.id}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Tag className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{category.name}</CardTitle>
                                        {category.description && (
                                            <CardDescription className="mt-1">{category.description}</CardDescription>
                                        )}
                                    </div>
                                </div>
                                <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-600">
                                    {category._count.expenses} expenses
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* Account Mappings */}
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                                    <span className="text-slate-600">Debit:</span>
                                    <span className="font-medium text-slate-900">
                                        {category.debitAccount ? `${category.debitAccount.code} - ${category.debitAccount.name}` : 'Not set'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                                    <span className="text-slate-600">Credit:</span>
                                    <span className="font-medium text-slate-900">
                                        {category.creditAccount ? `${category.creditAccount.code} - ${category.creditAccount.name}` : 'Not set'}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(category)}
                                    className="flex-1"
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(category.id)}
                                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
