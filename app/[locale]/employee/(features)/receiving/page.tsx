'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft, Check } from "lucide-react";

interface Product {
    id: string;
    name: string;
    sku: string;
    stockLevel: number;
    unit: string;
}

interface RecentAddition {
    productName: string;
    amount: number;
    unit: string;
    timestamp: Date;
}

export default function ReceivingPage() {
    const t = useTranslations();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [recentAdditions, setRecentAdditions] = useState<RecentAddition[]>([]);

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

    const handleQuickAdd = async (product: Product, amount: number) => {
        try {
            const response = await fetch('/api/inventory/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product.id,
                    changeAmount: amount,

                    reason: 'RESTOCK',
                    userId: (() => {
                        try {
                            const session = localStorage.getItem('employeeSession');
                            return session ? JSON.parse(session).id : null;
                        } catch (e) {
                            return null;
                        }
                    })(),
                }),
            });

            if (response.ok) {
                // Add to recent additions
                setRecentAdditions(prev => [
                    {
                        productName: product.name,
                        amount,
                        unit: product.unit,
                        timestamp: new Date()
                    },
                    ...prev.slice(0, 4) // Keep only last 5
                ]);

                // Refresh products
                fetchProducts(searchQuery);
            }
        } catch (error) {
            console.error('Failed to add stock:', error);
        }
    };

    const handleCustomAdd = async (product: Product) => {
        const amount = prompt(`Enter amount to add (${product.unit}):`);
        if (amount && !isNaN(parseFloat(amount))) {
            await handleQuickAdd(product, parseFloat(amount));
        }
    };

    return (
        <div className="min-h-screen p-6">
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
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            {t('Employee.receiving.title')}
                        </h1>
                        <p className="text-slate-500 text-sm">
                            {t('Employee.receiveStockDesc')}
                        </p>
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

                {recentAdditions.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 ml-1">
                            {t('Employee.receiving.recentAdditions')}
                        </h2>
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            {recentAdditions.map((addition, index) => (
                                <div key={index} className="flex items-center gap-4 p-4 border-b border-slate-100 last:border-0">
                                    <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                        <Check className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <span className="font-medium text-slate-900 block">{addition.productName}</span>
                                        <span className="text-xs text-slate-400">
                                            {addition.timestamp.toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-green-600 font-bold block">+{addition.amount}</span>
                                        <span className="text-xs text-slate-400 uppercase">{addition.unit}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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
                            products.map((product) => (
                                <div
                                    key={product.id}
                                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">{product.name}</h3>
                                            <p className="text-slate-500 text-sm mt-0.5">
                                                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-xs mr-2 font-mono">{product.sku}</span>
                                                {t('Employee.count.current')}: <span className="text-slate-900 font-semibold">{product.stockLevel} {product.unit}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            className="flex-1 h-12 text-lg font-semibold hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300"
                                            onClick={() => handleQuickAdd(product, 1)}
                                        >
                                            +1
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            className="flex-1 h-12 text-lg font-semibold hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300"
                                            onClick={() => handleQuickAdd(product, 5)}
                                        >
                                            +5
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            className="flex-1 h-12 text-lg font-semibold hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300"
                                            onClick={() => handleQuickAdd(product, 10)}
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
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
