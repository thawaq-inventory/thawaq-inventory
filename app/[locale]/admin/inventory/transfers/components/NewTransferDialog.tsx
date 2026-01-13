'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ArrowRight } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface NewTransferDialogProps {
    currentBranchId: string; // The user's current context
    onSuccess: () => void;
}

export default function NewTransferDialog({ currentBranchId, onSuccess }: NewTransferDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [fromBranchId, setFromBranchId] = useState('');
    const [toBranchId, setToBranchId] = useState('');
    const [notes, setNotes] = useState('');

    // Items State
    const [items, setItems] = useState<{ productId: string, product: any, quantity: number }[]>([]);

    // Data Lists
    const [branches, setBranches] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            fetchData();
            // Default 'From' to current branch
            if (currentBranchId) setFromBranchId(currentBranchId);
        }
    }, [open]);

    const fetchData = async () => {
        try {
            // Fetch Branches
            const resBranches = await fetch('/api/admin/branches');
            if (resBranches.ok) setBranches(await resBranches.json());

            // Fetch Products (Global list)
            const resProducts = await fetch('/api/products');
            if (resProducts.ok) setProducts(await resProducts.json());
        } catch (error) {
            console.error('Failed to load form data', error);
        }
    };

    const addItem = () => {
        setItems([...items, { productId: '', product: null, quantity: 1 }]);
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        if (field === 'productId') {
            const product = products.find(p => p.id === value);
            newItems[index] = { ...newItems[index], productId: value, product };
        } else {
            newItems[index] = { ...newItems[index], [field]: value };
        }
        setItems(newItems);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!fromBranchId || !toBranchId || items.length === 0) return;

        setLoading(true);
        try {
            const res = await fetch('/api/transfers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromBranchId,
                    toBranchId,
                    notes,
                    items: items.map(item => ({
                        productId: item.productId,
                        quantity: Number(item.quantity)
                    }))
                })
            });

            if (res.ok) {
                setOpen(false);
                onSuccess();
                // Reset form
                setItems([]);
                setNotes('');
                setToBranchId('');
            }
        } catch (error) {
            console.error('Failed to create transfer', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate total items
    const totalQuantity = items.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    New Transfer Request
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>New Transfer Request</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Route Selection */}
                    <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="space-y-2">
                            <Label>From (Source)</Label>
                            <Select value={fromBranchId} onValueChange={setFromBranchId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Source" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map(branch => (
                                        <SelectItem key={branch.id} value={branch.id}>
                                            {branch.name} <span className="text-xs text-gray-500">({branch.type})</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-center pb-3">
                            <ArrowRight className="w-6 h-6 text-gray-300" />
                        </div>

                        <div className="space-y-2">
                            <Label>To (Destination)</Label>
                            <Select value={toBranchId} onValueChange={setToBranchId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Destination" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches
                                        .filter(b => b.id !== fromBranchId)
                                        .map(branch => (
                                            <SelectItem key={branch.id} value={branch.id}>
                                                {branch.name} <span className="text-xs text-gray-500">({branch.type})</span>
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <Label className="text-base font-semibold">Items</Label>
                            <Button variant="outline" size="sm" onClick={addItem}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Item
                            </Button>
                        </div>

                        {items.length === 0 && (
                            <div className="text-center py-8 text-gray-500 text-sm border-2 border-dashed rounded-lg">
                                No items added yet. Click "Add Item" to start.
                            </div>
                        )}

                        {items.map((item, index) => (
                            <div key={index} className="flex items-end gap-3 p-3 bg-gray-50 rounded-lg group">
                                <div className="flex-1 space-y-2">
                                    <Label className="text-xs">Product</Label>
                                    <Select
                                        value={item.productId}
                                        onValueChange={(val) => updateItem(index, 'productId', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Product" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map(product => (
                                                <SelectItem key={product.id} value={product.id}>
                                                    {product.name} ({product.unit})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-24 space-y-2">
                                    <Label className="text-xs">Quantity</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-gray-400 hover:text-red-600"
                                    onClick={() => removeItem(index)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <Label>Notes (Optional)</Label>
                        <Input
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Reason for transfer..."
                        />
                    </div>
                </div>

                <DialogFooter className="flex items-center justify-between gap-4 border-t pt-4">
                    <div className="text-sm text-gray-500">
                        Total Quantity: <span className="font-semibold text-gray-900">{totalQuantity}</span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || items.length === 0 || !fromBranchId || !toBranchId}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
