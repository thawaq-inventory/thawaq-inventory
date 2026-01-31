'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft, Save, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProductName, useUnitName } from '@/hooks/use-localization';

interface Product {
    id: string;
    name: string;
    arabicName?: string | null;
    sku: string;
    stockLevel: number;
    unit: string;
}

interface StockChange {
    productId: string;
    newStock: number;
    originalStock: number;
    isCounted: boolean;
}

export default function StockCountPage() {
    const t = useTranslations();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [changes, setChanges] = useState<Record<string, StockChange>>({});
    const [saving, setSaving] = useState(false);

    const fetchProducts = async (search = '') => {
        setLoading(true);
        try {
            const url = search
                ? `/api/products?search=${encodeURIComponent(search)}`
                : '/api/products';
            const response = await fetch(url);
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProducts(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const getChange = (productId: string) => {
        return changes[productId] || {
            productId,
            newStock: products.find(p => p.id === productId)?.stockLevel || 0,
            originalStock: products.find(p => p.id === productId)?.stockLevel || 0,
            isCounted: false
        };
    };

    const updateStock = (productId: string, newStock: number) => {
        const current = getChange(productId);
        setChanges({
            ...changes,
            [productId]: {
                ...current,
                newStock,
                isCounted: true
            }
        });
    };

    const toggleCounted = (productId: string) => {
        const current = getChange(productId);
        setChanges({
            ...changes,
            [productId]: {
                ...current,
                isCounted: !current.isCounted
            }
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updates = Object.values(changes).filter(c => c.isCounted && c.newStock !== c.originalStock);

            await Promise.all(updates.map(update =>
                fetch('/api/inventory/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        productId: update.productId,
                        changeAmount: update.newStock - update.originalStock,
                        reason: 'ADJUSTMENT',
                        userId: null,
                    }),
                })
            ));

            setChanges({});
            fetchProducts(searchQuery);
            alert(t('Common.saveSuccess'));
        } catch (error) {
            console.error('Failed to save stock count:', error);
            alert(t('Common.saveFailed'));
        } finally {
            setSaving(false);
        }
    };

    const countedCount = Object.values(changes).filter(c => c.isCounted).length;
    const totalProducts = products.length;

    return (
        <div className="min-h-screen p-6 pb-32">
            <div className="max-w-4xl mx-auto">
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push('../employee')}
                            className="h-10 w-10 -ml-2 text-slate-500 hover:text-slate-900"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('Employee.count.title')}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-slate-900 transition-all duration-500 ease-out"
                                        style={{ width: `${(countedCount / totalProducts) * 100}%` }}
                                    />
                                </div>
                                <p className="text-xs font-medium text-slate-500">
                                    {countedCount} / {totalProducts} {t('Employee.count.counted')}
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <Input
                        placeholder={t('Employee.search')}
                        className="pl-10 h-12 text-lg shadow-sm border-slate-200 focus:ring-slate-900 focus:border-slate-900 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="text-center text-slate-500 py-12">
                        {t('Common.loading')}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 pb-24">
                        {products.map((product) => {
                            const change = getChange(product.id);
                            const hasChanged = change.newStock !== product.stockLevel;

                            return (
                                <div
                                    key={product.id}
                                    className={cn(
                                        "p-5 rounded-xl border transition-all duration-200",
                                        change.isCounted
                                            ? "bg-slate-50 border-slate-300 shadow-sm"
                                            : "bg-white border-slate-200"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => toggleCounted(product.id)}
                                                className={cn(
                                                    "transition-all duration-200",
                                                    change.isCounted ? "text-slate-900" : "text-slate-300 hover:text-slate-500"
                                                )}
                                            >
                                                {change.isCounted ? (
                                                    <CheckCircle2 className="w-8 h-8 fill-slate-100" />
                                                ) : (
                                                    <Circle className="w-8 h-8" />
                                                )}
                                            </button>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">{useProductName(product)}</h3>
                                                <p className="text-slate-500 text-sm font-mono">{product.sku}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">{t('Employee.count.current')}</div>
                                            <div className="text-2xl font-bold font-mono text-slate-900">
                                                {change.newStock} <span className="text-sm font-bold text-slate-400">{useUnitName(product.unit)}</span>
                                            </div>
                                            {hasChanged && (
                                                <div className="text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                                    {change.newStock > product.stockLevel ? '+' : ''}
                                                    {change.newStock - product.stockLevel}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            className="h-12 w-12 text-2xl rounded-lg border-slate-200 hover:border-slate-900 hover:text-slate-900 hover:bg-slate-50"
                                            onClick={() => updateStock(product.id, Math.max(0, change.newStock - 1))}
                                        >
                                            -
                                        </Button>
                                        <div className="flex-1">
                                            <Input
                                                type="number"
                                                className="h-12 text-center text-2xl font-mono font-bold bg-white border-slate-200 focus:border-slate-900 rounded-lg"
                                                value={change.newStock}
                                                onChange={(e) => updateStock(product.id, parseFloat(e.target.value) || 0)}
                                                onFocus={(e) => e.target.select()}
                                            />
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            className="h-12 w-12 text-2xl rounded-lg border-slate-200 hover:border-slate-900 hover:text-slate-900 hover:bg-slate-50"
                                            onClick={() => updateStock(product.id, change.newStock + 1)}
                                        >
                                            +
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Floating Save Button */}
            <div className="fixed bottom-6 left-0 right-0 px-6 z-50">
                <div className="max-w-4xl mx-auto">
                    <Button
                        size="lg"
                        className={cn(
                            "w-full h-16 text-lg font-bold shadow-xl transition-all duration-200 rounded-xl",
                            Object.values(changes).filter(c => c.isCounted && c.newStock !== c.originalStock).length > 0
                                ? "bg-slate-900 hover:bg-slate-800 text-white"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        )}
                        onClick={handleSave}
                        disabled={saving || Object.values(changes).filter(c => c.isCounted && c.newStock !== c.originalStock).length === 0}
                    >
                        {saving ? t('Common.loading') : (
                            <div className="flex items-center gap-3">
                                <Save className="w-5 h-5" />
                                {t('Employee.count.saveAll')}
                                <span className="bg-white/20 px-2 py-0.5 rounded text-sm">
                                    {Object.values(changes).filter(c => c.isCounted && c.newStock !== c.originalStock).length}
                                </span>
                            </div>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
