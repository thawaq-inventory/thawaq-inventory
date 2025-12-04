'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, TrendingUp, Package, Save } from "lucide-react";

interface Product {
    id: string;
    name: string;
    sku: string;
    stockLevel: number;
    unit: string;
    minStock: number;
    maxStock: number;
    cost: number;
}

export default function ParLevelsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changes, setChanges] = useState<Record<string, { minStock?: number; maxStock?: number }>>({});

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/par-levels');
            const data = await res.json();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (productId: string, field: 'minStock' | 'maxStock', value: string) => {
        const numValue = parseFloat(value) || 0;
        setChanges(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                [field]: numValue
            }
        }));
    };

    const saveChanges = async () => {
        setSaving(true);
        try {
            const updates = Object.entries(changes).map(([productId, data]) => ({
                productId,
                ...data
            }));

            await fetch('/api/par-levels', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates })
            });

            setChanges({});
            fetchProducts();
        } catch (error) {
            console.error('Error saving par levels:', error);
        } finally {
            setSaving(false);
        }
    };

    const getStockStatus = (product: Product) => {
        if (product.stockLevel < product.minStock) return { label: 'Critical', color: 'bg-red-100 text-red-700' };
        if (product.maxStock > 0 && product.stockLevel > product.maxStock) return { label: 'Overstocked', color: 'bg-yellow-100 text-yellow-700' };
        return { label: 'OK', color: 'bg-green-100 text-green-700' };
    };

    const criticalCount = products.filter(p => p.stockLevel < p.minStock).length;
    const hasChanges = Object.keys(changes).length > 0;

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
                    <h1 className="text-3xl font-bold text-slate-900">Par Levels Configuration</h1>
                    <p className="text-slate-500 mt-1">Set minimum and maximum stock levels for automatic reorder suggestions</p>
                </div>
                {hasChanges && (
                    <Button
                        onClick={saveChanges}
                        disabled={saving}
                        className="bg-gradient-to-r from-blue-500 to-blue-600"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{products.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Critical Stock</CardTitle>
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
                        <p className="text-xs text-slate-500 mt-1">Below minimum stock</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Pending Changes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{Object.keys(changes).length}</div>
                        <p className="text-xs text-slate-500 mt-1">Unsaved modifications</p>
                    </CardContent>
                </Card>
            </div>

            {/* Products Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Product Par Levels</CardTitle>
                    <CardDescription>Configure min/max stock levels for each product</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {products.map((product) => {
                            const status = getStockStatus(product);
                            const minValue = changes[product.id]?.minStock ?? product.minStock;
                            const maxValue = changes[product.id]?.maxStock ?? product.maxStock;

                            return (
                                <div key={product.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-semibold text-slate-900">{product.name}</h3>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                                    {status.label}
                                                </span>
                                            </div>
                                            <div className="text-sm text-slate-500 mt-1">
                                                SKU: {product.sku} | Current Stock: <span className="font-semibold">{product.stockLevel} {product.unit}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-medium text-slate-600 mb-1 block">
                                                Minimum Stock ({product.unit})
                                            </label>
                                            <Input
                                                type="number"
                                                value={minValue}
                                                onChange={(e) => handleChange(product.id, 'minStock', e.target.value)}
                                                className="h-9"
                                                step="0.1"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-600 mb-1 block">
                                                Maximum Stock ({product.unit})
                                            </label>
                                            <Input
                                                type="number"
                                                value={maxValue}
                                                onChange={(e) => handleChange(product.id, 'maxStock', e.target.value)}
                                                className="h-9"
                                                step="0.1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
