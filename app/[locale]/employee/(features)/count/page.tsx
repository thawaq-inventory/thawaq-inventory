'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft, Save, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getArabicUnit } from '@/lib/utils/arabic-translation';

interface Product {
    id: string;
    name: string;
    arabicName?: string | null;
    sku: string;
    stockLevel: number;
    unit: string;
    purchaseUnit?: string | null;
    conversionFactor: number;
}

interface StockChange {
    productId: string;
    newStock: number;
    originalStock: number;
    isCounted: boolean;
}

// ─── Plain helper functions (NOT hooks) ──────────────────────────────────────
// These are safe to call anywhere, including inside .map() loops.

function getProductLabel(product: Product, locale: string): string {
    if (locale === 'ar' && product.arabicName) return product.arabicName;
    return product.name;
}

function getUnitLabel(unit: string | null | undefined, locale: string): string {
    if (!unit) return '';
    if (locale === 'ar') return getArabicUnit(unit);
    return unit;
}

function getCountUnit(product: Product, locale: string): string {
    // The unit the employee physically counts in (e.g. "Pack", "Bulk (1000Grams)")
    return getUnitLabel(product.purchaseUnit || product.unit, locale);
}
// ─────────────────────────────────────────────────────────────────────────────

export default function StockCountPage() {
    // ✅ ALL hooks called at the top level of the component — never inside loops
    const t = useTranslations();
    const locale = useLocale();
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
        const product = products.find(p => p.id === productId);
        const factor = product?.conversionFactor || 1;
        // Display in Purchase Units (e.g. Packs), not raw Base Units (e.g. grams)
        const currentStockInCountUnits = Math.floor((product?.stockLevel || 0) / factor);

        return changes[productId] || {
            productId,
            newStock: currentStockInCountUnits,
            originalStock: currentStockInCountUnits,
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
            // Include ALL counted items — even those matching the system quantity
            // (employee confirming stock level is a valid, important action)
            const updates = Object.values(changes).filter(c => c.isCounted);

            if (updates.length === 0) {
                alert('Please mark at least one item as counted before submitting.');
                setSaving(false);
                return;
            }

            const payloadItems = updates.map(update => ({
                productId: update.productId,
                actualQuantity: update.newStock  // Backend multiplies by conversionFactor
            }));

            // Get branchId and userId from the employee session stored in localStorage
            let branchId: string | null = null;
            let userId: string | null = null;
            try {
                const session = JSON.parse(localStorage.getItem('employeeSession') || '{}');
                branchId = session.branchId || null;
                userId = session.id || null;
            } catch (e) {
                console.error('Could not read session branchId/userId', e);
            }

            const response = await fetch('/api/inventory/reconcile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: payloadItems,
                    branchId,  // Explicitly send branchId from session
                    userId,    // Explicitly send userId from session
                    notes: 'Employee App Submission'
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Submission failed');
            }
            const result = await response.json();

            setChanges({});
            fetchProducts(searchQuery);
            alert(`✅ Count submitted for review!\n\n${result.processed} item(s) sent to Admin for approval.\nYour inventory will update once the Admin approves the count.`);
        } catch (error: any) {
            console.error('Failed to save stock count:', error);
            alert(`Submission failed: ${error.message || 'Unknown error'}`);
        } finally {
            setSaving(false);
        }
    };

    const pendingCount = Object.values(changes).filter(c => c.isCounted).length;
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
                                        style={{ width: `${totalProducts > 0 ? (countedCount / totalProducts) * 100 : 0}%` }}
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
                            const hasChanged = change.newStock !== change.originalStock;
                            // ✅ Plain functions — safe inside .map(), no hooks called here
                            const productLabel = getProductLabel(product, locale);
                            const countUnit = getCountUnit(product, locale);

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
                                                <h3 className="text-lg font-bold text-slate-900">{productLabel}</h3>
                                                <p className="text-slate-500 text-sm font-mono">{product.sku}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">{t('Employee.count.current')}</div>
                                            <div className="text-2xl font-bold font-mono text-slate-900 flex items-baseline justify-end gap-1.5">
                                                {change.newStock}
                                                <span className="text-sm font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded border border-amber-200 uppercase tracking-wide">
                                                    {countUnit}
                                                </span>
                                            </div>
                                            {hasChanged && (
                                                <div className="text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded inline-block mt-1">
                                                    {change.newStock > change.originalStock ? '+' : ''}
                                                    {change.newStock - change.originalStock}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 items-center">
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            className="h-12 w-12 text-2xl rounded-lg border-slate-200 hover:border-slate-900 hover:text-slate-900 hover:bg-slate-50"
                                            onClick={() => updateStock(product.id, Math.max(0, change.newStock - 1))}
                                        >
                                            -
                                        </Button>
                                        <div className="flex-1 relative">
                                            <Input
                                                type="number"
                                                className="h-12 text-center text-2xl font-mono font-bold bg-white border-slate-200 focus:border-slate-900 rounded-lg pr-16"
                                                value={change.newStock}
                                                onChange={(e) => updateStock(product.id, parseFloat(e.target.value) || 0)}
                                                onFocus={(e) => e.target.select()}
                                            />
                                            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                                                <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded uppercase">
                                                    {countUnit}
                                                </span>
                                            </div>
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
                            pendingCount > 0
                                ? "bg-slate-900 hover:bg-slate-800 text-white"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        )}
                        onClick={handleSave}
                        disabled={saving || pendingCount === 0}
                    >
                        {saving ? t('Common.loading') : (
                            <div className="flex items-center gap-3">
                                <Save className="w-5 h-5" />
                                {t('Employee.count.saveAll')}
                                <span className="bg-white/20 px-2 py-0.5 rounded text-sm">
                                    {pendingCount}
                                </span>
                            </div>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
