'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft, Check, ShoppingCart, Trash2, Edit2, Send, X, Plus, Minus } from "lucide-react";
import { useProductName, useUnitName } from '@/hooks/use-localization';

interface Product {
    id: string;
    name: string;
    arabicName?: string | null;
    sku: string;
    stockLevel: number;
    unit: string;
}

interface DraftItem {
    productId: string;
    productName: string;
    sku: string;
    unit: string;
    amount: number;
}

export default function ReceivingPage() {
    const t = useTranslations();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
    const [showReview, setShowReview] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [editingItem, setEditingItem] = useState<string | null>(null);
    const [editAmount, setEditAmount] = useState('');

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

    // Add item to draft
    const addToDraft = (product: Product, amount: number) => {
        setDraftItems(prev => {
            const existing = prev.find(item => item.productId === product.id);
            if (existing) {
                // Update existing item amount
                return prev.map(item =>
                    item.productId === product.id
                        ? { ...item, amount: item.amount + amount }
                        : item
                );
            }
            // Add new item
            return [...prev, {
                productId: product.id,
                productName: product.name,
                sku: product.sku,
                unit: product.unit,
                amount
            }];
        });
    };

    // Remove item from draft
    const removeFromDraft = (productId: string) => {
        setDraftItems(prev => prev.filter(item => item.productId !== productId));
    };

    // Update item amount in draft
    const updateDraftAmount = (productId: string, newAmount: number) => {
        if (newAmount <= 0) {
            removeFromDraft(productId);
            return;
        }
        setDraftItems(prev =>
            prev.map(item =>
                item.productId === productId
                    ? { ...item, amount: newAmount }
                    : item
            )
        );
        setEditingItem(null);
    };

    // Handle custom amount input
    const handleCustomAdd = (product: Product) => {
        const amount = prompt(`Enter amount to add (${product.unit}):`);
        if (amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0) {
            addToDraft(product, parseFloat(amount));
        }
    };

    // Submit all draft items to the database
    const submitInventory = async () => {
        if (draftItems.length === 0) return;

        setSubmitting(true);
        try {
            const userId = (() => {
                try {
                    const session = localStorage.getItem('employeeSession');
                    return session ? JSON.parse(session).id : null;
                } catch (e) {
                    return null;
                }
            })();

            // Submit all items
            const results = await Promise.all(
                draftItems.map(item =>
                    fetch('/api/inventory/update', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            productId: item.productId,
                            changeAmount: item.amount,
                            reason: 'RESTOCK',
                            userId
                        })
                    })
                )
            );

            const allSuccessful = results.every(r => r.ok);
            if (allSuccessful) {
                setSubmitted(true);
                setDraftItems([]);
                // Auto-hide success message after 3 seconds
                setTimeout(() => {
                    setSubmitted(false);
                    setShowReview(false);
                }, 3000);
            } else {
                alert('Some items failed to save. Please try again.');
            }
        } catch (error) {
            console.error('Failed to submit inventory:', error);
            alert('Failed to submit inventory. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Get total items count in draft
    const totalDraftItems = draftItems.reduce((sum, item) => sum + item.amount, 0);

    // Review Screen
    if (showReview) {
        return (
            <div className="min-h-screen p-6 bg-slate-50">
                <div className="max-w-4xl mx-auto">
                    <header className="flex items-center gap-4 mb-8">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowReview(false)}
                            className="h-10 w-10 -ml-2 text-slate-500 hover:text-slate-900"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                                Review Inventory
                            </h1>
                            <p className="text-slate-500 text-sm">
                                {draftItems.length} items • {totalDraftItems} total units
                            </p>
                        </div>
                    </header>

                    {submitted ? (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-xl font-bold text-green-900 mb-2">Inventory Submitted!</h2>
                            <p className="text-green-700">All items have been saved successfully.</p>
                        </div>
                    ) : (
                        <>
                            {/* Draft Items List */}
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
                                {draftItems.map((item) => (
                                    <div key={item.productId} className="flex items-center gap-4 p-4 border-b border-slate-100 last:border-0">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-slate-900">{useProductName({ name: item.productName, arabicName: products.find(p => p.id === item.productId)?.arabicName })}</h3>
                                            <p className="text-sm text-slate-500">
                                                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-xs font-mono">{item.sku}</span>
                                            </p>
                                        </div>

                                        {editingItem === item.productId ? (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    value={editAmount}
                                                    onChange={(e) => setEditAmount(e.target.value)}
                                                    className="w-20 h-10 text-center"
                                                    autoFocus
                                                />
                                                <Button
                                                    size="sm"
                                                    onClick={() => {
                                                        const newAmount = parseFloat(editAmount);
                                                        if (!isNaN(newAmount)) {
                                                            updateDraftAmount(item.productId, newAmount);
                                                        }
                                                    }}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setEditingItem(null)}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => updateDraftAmount(item.productId, item.amount - 1)}
                                                    className="h-8 w-8"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </Button>
                                                <div
                                                    className="w-16 text-center font-bold text-lg text-green-600 cursor-pointer hover:bg-slate-50 py-1 rounded"
                                                    onClick={() => {
                                                        setEditingItem(item.productId);
                                                        setEditAmount(item.amount.toString());
                                                    }}
                                                >
                                                    +{item.amount}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => updateDraftAmount(item.productId, item.amount + 1)}
                                                    className="h-8 w-8"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                                <span className="text-sm text-slate-500 uppercase w-12">{useUnitName(item.unit)}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeFromDraft(item.productId)}
                                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {draftItems.length === 0 && (
                                    <div className="p-8 text-center text-slate-500">
                                        No items in draft. Go back to add products.
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            {draftItems.length > 0 && (
                                <Button
                                    onClick={submitInventory}
                                    disabled={submitting}
                                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                >
                                    {submitting ? (
                                        'Submitting...'
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5 mr-2" />
                                            Submit Inventory ({draftItems.length} items)
                                        </>
                                    )}
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    }

    // Main Product Selection Screen
    return (
        <div className="min-h-screen p-6 bg-slate-50">
            <div className="max-w-4xl mx-auto">
                <header className="flex items-center gap-4 mb-8">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('../employee')}
                        className="h-10 w-10 -ml-2 text-slate-500 hover:text-slate-900"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            {t('Employee.receiving.title')}
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Add items to your list, then review and submit
                        </p>
                    </div>
                </header>

                {/* Search */}
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

                {/* Draft Summary Banner */}
                {draftItems.length > 0 && (
                    <div
                        onClick={() => setShowReview(true)}
                        className="mb-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl p-4 flex items-center justify-between cursor-pointer hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <ShoppingCart className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-semibold">{draftItems.length} items in draft</p>
                                <p className="text-sm text-green-100">{totalDraftItems} total units</p>
                            </div>
                        </div>
                        <Button variant="secondary" className="bg-white text-green-700 hover:bg-green-50">
                            Review & Submit
                        </Button>
                    </div>
                )}

                {/* Products List */}
                {loading ? (
                    <div className="text-center text-slate-500 py-12">
                        {t('Common.loading')}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {products.length === 0 ? (
                            <div className="text-center text-slate-500 py-12 bg-white rounded-xl border border-dashed border-slate-200">
                                No products found
                            </div>
                        ) : (
                            products.map((product) => {
                                const draftItem = draftItems.find(d => d.productId === product.id);
                                return (
                                    <div
                                        key={product.id}
                                        className={`bg-white p-5 rounded-xl border shadow-sm transition-all ${draftItem ? 'border-green-300 ring-2 ring-green-100' : 'border-slate-200'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">{useProductName(product)}</h3>
                                                <p className="text-slate-500 text-sm mt-0.5">
                                                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-xs mr-2 font-mono">{product.sku}</span>
                                                    Current: <span className="text-slate-900 font-semibold">{product.stockLevel} {useUnitName(product.unit)}</span>
                                                </p>
                                            </div>
                                            {draftItem && (
                                                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                                                    +{draftItem.amount} {useUnitName(draftItem.unit)}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="lg"
                                                className="flex-1 h-12 text-lg font-semibold hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                                                onClick={() => addToDraft(product, 1)}
                                            >
                                                +1
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="lg"
                                                className="flex-1 h-12 text-lg font-semibold hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                                                onClick={() => addToDraft(product, 5)}
                                            >
                                                +5
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="lg"
                                                className="flex-1 h-12 text-lg font-semibold hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                                                onClick={() => addToDraft(product, 10)}
                                            >
                                                +10
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="lg"
                                                className="flex-1 h-12 text-base font-medium bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                                onClick={() => handleCustomAdd(product)}
                                            >
                                                {t('Employee.receiving.custom')}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
