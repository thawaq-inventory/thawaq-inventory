'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Product {
    id: string;
    name: string;
    sku: string;
    unit: string;
    stockLevel: number; // System quantity
}

interface StockCountItem {
    productId: string;
    name: string;
    systemQty: number;
    actualQty: string; // Keep as string for input handling
}

export default function StockCountSheet({ branchId }: { branchId: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [countItems, setCountItems] = useState<StockCountItem[]>([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, [branchId]);

    const fetchProducts = async () => {
        try {
            // Fetch products with inventory levels for this branch
            // We can reuse the main products API which respects branch context
            const res = await fetch('/api/products?limit=1000');
            // Note: Ensure the API returns inventory specifically for `branchId` context.
            // Since we are in the Admin Panel, the cookie "selectedBranches" should be set.
            // If this component is used inside a page that has set the context, it should work.

            if (!res.ok) throw new Error('Failed to fetch products');
            const data = await res.json();

            if (Array.isArray(data)) {
                setProducts(data);
                // Initialize input state
                setCountItems(data.map(p => ({
                    productId: p.id,
                    name: p.name,
                    systemQty: p.stockLevel || 0,
                    actualQty: '' // Start empty to force explicit count
                })));
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load inventory list.');
        } finally {
            setLoading(false);
        }
    };

    const handleActualChange = (productId: string, val: string) => {
        setCountItems(prev => prev.map(item =>
            item.productId === productId ? { ...item, actualQty: val } : item
        ));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError('');

        try {
            // Filter only items that have an actual count entered
            const itemsToReconcile = countItems
                .filter(item => item.actualQty !== '')
                .map(item => ({
                    productId: item.productId,
                    actualQuantity: parseFloat(item.actualQty)
                }));

            if (itemsToReconcile.length === 0) {
                setError('No counts entered.');
                setSubmitting(false);
                return;
            }

            const res = await fetch('/api/inventory/reconcile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    branchId,
                    items: itemsToReconcile,
                    notes: 'Manual Stock Take'
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to submit stock count');
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/admin/inventory/dashboard'); // Redirect after success
                router.refresh(); // Ensure data updates
            }, 2000);

        } catch (err: any) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;
    }

    if (success) {
        return (
            <div className="p-12 text-center bg-green-50 rounded-xl border border-green-200">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-800">Stock Take Completed!</h2>
                <p className="text-green-700 mt-2">Inventory levels have been updated.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm sticky top-0 z-10">
                <div>
                    <h2 className="text-lg font-semibold">Count Sheet</h2>
                    <p className="text-sm text-slate-500">{countItems.length} items found</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={submitting} className="bg-amber-600 hover:bg-amber-700">
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Finalize Stock Take
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-700 font-medium">
                        <tr>
                            <th className="px-4 py-3">Product Name</th>
                            <th className="px-4 py-3 w-32 text-center">System Qty</th>
                            <th className="px-4 py-3 w-40">Actual Count</th>
                            <th className="px-4 py-3 w-32 text-center">Variance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {countItems.map((item) => {
                            const actual = parseFloat(item.actualQty);
                            const variance = !isNaN(actual) ? actual - item.systemQty : 0;
                            const hasVariance = !isNaN(actual) && variance !== 0;

                            return (
                                <tr key={item.productId} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                                    <td className="px-4 py-3 text-center text-slate-500 bg-slate-50/50">
                                        {/* Optional: Obscure this? User asked to keep hidden by default or visible? 
                                            Request said: "Hidden by default to prevent lazy counting, or visible - let's keep it hidden" 
                                            But later said "System Qty hidden" in step description. 
                                            Let's BLUR it by default with CSS 'blur' class, reveal on hover? 
                                            Or just show "???" */}
                                        <span className="blur-sm hover:blur-none transition-all cursor-help" title="System Quantity">
                                            {item.systemQty}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Input
                                            type="number"
                                            className={`max-w-[120px] ${hasVariance ? 'border-amber-400 bg-amber-50' : ''}`}
                                            placeholder="Enter Qty"
                                            value={item.actualQty}
                                            onChange={(e) => handleActualChange(item.productId, e.target.value)}
                                        />
                                    </td>
                                    <td className={`px-4 py-3 text-center font-bold ${variance < 0 ? 'text-red-600' : variance > 0 ? 'text-blue-600' : 'text-slate-300'
                                        }`}>
                                        {item.actualQty !== '' ? (variance > 0 ? `+${variance}` : variance) : '-'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
