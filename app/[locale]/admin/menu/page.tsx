'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Assuming these exist
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Save, X, Loader2 } from "lucide-react";
import { getMenuItems, updateMenuItem, deleteMenuItem } from '@/app/actions/menu';
import { BulkImportButton } from '@/components/admin/BulkImportButton';

interface MenuItem {
    id: string;
    posString: string;
    sellingPrice: number;
}

export default function MenuManager() {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ posString: string; sellingPrice: string }>({ posString: '', sellingPrice: '' });
    const [saveLoading, setSaveLoading] = useState(false);

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        setLoading(true);
        try {
            const data = await getMenuItems();
            setItems(data);
        } catch (error) {
            console.error("Failed to load menu items", error);
        } finally {
            setLoading(false);
        }
    };

    const startEditing = (item: MenuItem) => {
        setEditingId(item.id);
        setEditForm({ posString: item.posString, sellingPrice: item.sellingPrice.toString() });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditForm({ posString: '', sellingPrice: '' });
    };

    const handleSave = async (id: string) => {
        setSaveLoading(true);
        try {
            const price = parseFloat(editForm.sellingPrice);
            if (isNaN(price)) {
                alert("Invalid Price");
                return;
            }

            const result = await updateMenuItem(id, {
                posString: editForm.posString,
                sellingPrice: price
            });

            if (result.success) {
                setItems(items.map(i => i.id === id ? { ...i, posString: editForm.posString, sellingPrice: price } : i));
                setEditingId(null);
            } else {
                alert("Failed to update");
            }
        } catch (e) {
            console.error(e);
            alert("Error saving");
        } finally {
            setSaveLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this item?")) return;
        try {
            const result = await deleteMenuItem(id);
            if (result.success) {
                setItems(items.filter(i => i.id !== id));
            } else {
                alert("Failed to delete");
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Menu Manager</h1>
                    <p className="text-slate-600 mt-2">Manage customer-facing menu items and prices.</p>
                </div>
                <div>
                    <BulkImportButton
                        apiEndpoint="/api/upload/menu-prices"
                        label="Import Menu CSV"
                        onSuccess={loadItems}
                    />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>POS Menu Items ({items.length})</CardTitle>
                    <CardDescription>Items synced from your POS exports. Edit names or prices here.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[400px]">POS Item Name</TableHead>
                                <TableHead className="w-[150px]">Selling Price (JOD)</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        {editingId === item.id ? (
                                            <Input
                                                value={editForm.posString}
                                                onChange={(e) => setEditForm({ ...editForm, posString: e.target.value })}
                                            />
                                        ) : (
                                            <span className="font-medium text-slate-700">{item.posString}</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editingId === item.id ? (
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={editForm.sellingPrice}
                                                onChange={(e) => setEditForm({ ...editForm, sellingPrice: e.target.value })}
                                            />
                                        ) : (
                                            <span>{item.sellingPrice.toFixed(2)} JOD</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {editingId === item.id ? (
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="default" onClick={() => handleSave(item.id)} disabled={saveLoading}>
                                                    <Save className="h-4 w-4 mr-1" /> Save
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={cancelEditing}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="sm" variant="outline" onClick={() => startEditing(item)}>
                                                    Edit
                                                </Button>
                                                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {items.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                                        No menu items found. Upload a sales report to populate this list.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
