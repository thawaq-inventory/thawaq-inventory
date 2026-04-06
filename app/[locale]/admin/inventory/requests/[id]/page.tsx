'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from '@/i18n/routing';
import { Loader2, ArrowLeft, Check, X, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Link } from '@/i18n/routing';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const t_params = use(params);
    const router = useRouter();
    const [requestData, setRequestData] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [allProducts, setAllProducts] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, [t_params.id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/inventory/requests/${t_params.id}`);
            if (!res.ok) throw new Error('Failed to fetch request details');
            const data = await res.json();
            setRequestData(data);
            setItems(data.items || []);

            // Fetch products for the "Add Missing Mode"
            const pRes = await fetch(`/api/products?minimal=true`);
            if (pRes.ok) {
                const pData = await pRes.json();
                setAllProducts(pData);
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = (idx: number, newVal: string) => {
        const val = parseFloat(newVal);
        const newItems = [...items];
        newItems[idx].countedQuantity = isNaN(val) ? 0 : val;
        setItems(newItems);
    };

    const handleAddProduct = (product: any) => {
        // Find if already exists
        if (items.some(i => i.productId === product.id)) {
            return;
        }

        const newItem = {
            productId: product.id,
            systemQuantity: 0, // Assume 0 if not fetched, server will correct it
            countedQuantity: 0, 
            variance: 0,
            product: {
                name: product.name,
                sku: product.sku,
                unit: product.unit || 'UNIT',
                cost: product.cost || 0
            }
        };

        setItems([...items, newItem]);
        setSearchTerm('');
    };

    const handleAction = async (action: 'APPROVE' | 'REJECT') => {
        setProcessing(true);
        setError(null);
        try {
            // Get user info if available
            let adminUserId = 'system';
            try {
                const meRes = await fetch('/api/auth/me');
                if (meRes.ok) {
                    const meData = await meRes.json();
                    adminUserId = meData.user.id;
                }
            } catch (e) {}

            const payload = {
                action,
                adminUserId,
                items: items
            };

            const res = await fetch(`/api/inventory/requests/${t_params.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to process request');
            
            router.push('/admin/inventory/requests');
        } catch (err: any) {
            setError(err.message);
            setProcessing(false);
        }
    };

    if (loading) {
        return <div className="flex h-64 justify-center items-center"><Loader2 className="animate-spin w-8 h-8 text-sky-500" /></div>;
    }

    if (!requestData) {
        return <div className="p-8">Request not found.</div>;
    }

    const isPending = requestData.status === 'PENDING';

    const filteredProducts = allProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/inventory/requests">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Review Stock Count</h1>
                        <p className="text-sm text-slate-500">Submitted by {requestData.user?.name} on {new Date(requestData.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>

                {isPending && (
                    <div className="flex gap-3">
                        <Button 
                            variant="destructive" 
                            disabled={processing} 
                            onClick={() => handleAction('REJECT')}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Reject
                        </Button>
                        <Button 
                            className="bg-green-600 hover:bg-green-700 text-white" 
                            disabled={processing}
                            onClick={() => handleAction('APPROVE')}
                        >
                            {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                            Approve & Apply
                        </Button>
                    </div>
                )}
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                    {error}
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Counted Items ({items.length})</CardTitle>
                    <CardDescription>
                        {isPending ? 'You can adjust the quantities below before approving.' : `This request is ${requestData.status}.`}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="rounded-md border">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 font-medium text-slate-500">Product</th>
                                    <th className="px-4 py-3 font-medium text-slate-500">SKU</th>
                                    <th className="px-4 py-3 font-medium text-slate-500 text-right">System Qty</th>
                                    <th className="px-4 py-3 font-medium text-slate-500 text-right">Counted Qty</th>
                                    <th className="px-4 py-3 font-medium text-slate-500 text-right">Variance</th>
                                    <th className="px-4 py-3 font-medium text-slate-500 text-right">Final Qty</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((item, idx) => {
                                    const v = item.countedQuantity - item.systemQuantity;
                                    const vColor = v > 0 ? 'text-green-600' : v < 0 ? 'text-red-600' : 'text-slate-400';
                                    return (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-900">{item.product?.name}</td>
                                            <td className="px-4 py-3 text-slate-500">{item.product?.sku}</td>
                                            <td className="px-4 py-3 text-right text-slate-500">{item.systemQuantity} {item.product?.unit}</td>
                                            <td className="px-4 py-3 text-right">
                                                {isPending ? (
                                                    <Input 
                                                        type="number" 
                                                        value={item.countedQuantity} 
                                                        onChange={(e) => handleQuantityChange(idx, e.target.value)}
                                                        className="w-24 ml-auto text-right h-8"
                                                        step="0.01"
                                                    />
                                                ) : (
                                                    <span>{item.countedQuantity}</span>
                                                )}
                                            </td>
                                            <td className={`px-4 py-3 text-right font-medium ${vColor}`}>
                                                {v > 0 ? '+' : ''}{v.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-900">
                                                {item.countedQuantity} {item.product?.unit}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {items.length === 0 && (
                                    <tr><td colSpan={6} className="p-4 text-center text-slate-500">No items counted</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {isPending && (
                        <div className="pt-4 border-t">
                            <h4 className="text-sm font-medium mb-3">Add Missing Product</h4>
                            <div className="flex gap-2 mb-4">
                                <div className="flex-1 relative">
                                    <Input 
                                        placeholder="Search by name or SKU..." 
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                    {searchTerm && filteredProducts.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 bg-white shadow-lg border rounded-md mt-1 z-10 p-1">
                                            {filteredProducts.map(p => (
                                                <div 
                                                    key={p.id} 
                                                    className="p-2 hover:bg-slate-50 cursor-pointer text-sm flex justify-between items-center"
                                                    onClick={() => handleAddProduct(p)}
                                                >
                                                    <span>{p.name} <span className="text-slate-400 text-xs ml-2">{p.sku}</span></span>
                                                    <PlusCircle className="w-4 h-4 text-sky-500" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}

