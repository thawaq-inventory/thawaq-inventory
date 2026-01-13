'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    stockLevel: number;
}

export function RecordWasteDialog({ branchId }: { branchId: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);

    // Form State
    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('Expired');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            fetchProducts();
        }
    }, [open]);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products?limit=1000');
            const data = await res.json();
            if (Array.isArray(data)) setProducts(data);
        } catch (err) {
            console.error('Failed to fetch products', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const payload = {
                branchId,
                productId: selectedProductId,
                quantity: parseFloat(quantity),
                reason,
                notes
            };

            const res = await fetch('/api/inventory/waste', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to record waste');
            }

            setOpen(false);
            setQuantity('');
            setNotes('');
            setSelectedProductId('');
            alert('Waste recorded successfully.');
            window.location.reload(); // Refresh to show stock change

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const wasteReasons = [
        'Expired',
        'Damaged/Dropped',
        'Burned/Production Error',
        'Staff Meal',
        'Theft',
        'Other'
    ];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    Record Waste
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Record Spoilage / Waste</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Product</Label>
                        <select
                            className="w-full p-2 border rounded-md"
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            required
                        >
                            <option value="">Select Product...</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} (Qty: {p.stockLevel})</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label>Reason</Label>
                        <select
                            className="w-full p-2 border rounded-md"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        >
                            {wasteReasons.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label>Quantity Wasted</Label>
                        <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="e.g. 2.5"
                            required
                            min="0.01"
                            step="0.01"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Notes (Optional)</Label>
                        <Input
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Details..."
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading} variant="destructive">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Waste'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
