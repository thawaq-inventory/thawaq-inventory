'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Download, Upload, Search, Trash2, Edit } from "lucide-react";
import { ProductDialog } from "@/components/ProductDialog";
import { ImportDialog } from "@/components/ImportDialog";

interface Product {
    id: string;
    name: string;
    sku: string;
    description?: string | null;
    stockLevel: number;
    unit: string;
    minStock: number;
    cost: number;
    price: number;
}

export default function AdminDashboard() {
    const t = useTranslations();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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

    const handleAddProduct = () => {
        setSelectedProduct(null);
        setOpen(true);
    };

    const handleEditProduct = (product: Product) => {
        setSelectedProduct(product);
        setOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('Common.deleteConfirm'))) return;

        try {
            const response = await fetch(`/api/products/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchProducts(searchQuery);
            }
        } catch (error) {
            console.error('Failed to delete product:', error);
        }
    };

    const getStockStatus = (product: Product) => {
        if (product.stockLevel === 0) {
            return { label: t('Inventory.outOfStock'), className: 'bg-red-100 text-red-700' };
        } else if (product.stockLevel <= product.minStock) {
            return { label: t('Inventory.lowStock'), className: 'bg-yellow-100 text-yellow-700' };
        }
        return { label: '', className: 'bg-green-100 text-green-700' };
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {t('Admin.title')}
                    </h1>
                    <p className="text-slate-500 mt-1">Manage your inventory and products</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-10 bg-white hover:bg-slate-50 border-slate-200 text-slate-700">
                        <Download className="w-4 h-4 mr-2" />
                        {t('Admin.export')}
                    </Button>
                    <Button
                        variant="outline"
                        className="h-10 bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                        onClick={() => setImportOpen(true)}
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        {t('Admin.import')}
                    </Button>
                    <Button
                        onClick={() => {
                            setSelectedProduct(null);
                            setOpen(true);
                        }}
                        className="h-10 bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {t('Admin.addItem')}
                    </Button>
                </div>
            </div>

            {/* Low Stock Alert */}
            {products.filter(p => p.stockLevel <= p.minStock && p.stockLevel > 0).length > 0 && (
                <div className="dashboard-card rounded-xl p-4 mb-6 border-l-4 border-amber-500">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 mb-1">Low Stock Alert</h3>
                            <p className="text-sm text-slate-600">
                                {products.filter(p => p.stockLevel <= p.minStock && p.stockLevel > 0).length} {' '}
                                {products.filter(p => p.stockLevel <= p.minStock && p.stockLevel > 0).length === 1 ? 'item needs' : 'items need'} restocking
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="dashboard-card rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-white">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                            placeholder={t('Admin.searchPlaceholder')}
                            className="pl-9 h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b-slate-200">
                                <TableHead className="font-semibold text-slate-700 py-4">{t('Product.name')}</TableHead>
                                <TableHead className="font-semibold text-slate-700 py-4">{t('Product.sku')}</TableHead>
                                <TableHead className="font-semibold text-slate-700 py-4">{t('Product.stockLevel')}</TableHead>
                                <TableHead className="font-semibold text-slate-700 py-4">{t('Product.cost')}</TableHead>
                                <TableHead className="font-semibold text-slate-700 py-4">{t('Product.price')}</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700 py-4">{t('Common.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                                        {t('Common.loading')}
                                    </TableCell>
                                </TableRow>
                            ) : products.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                                        No products found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                products.map((product) => (
                                    <TableRow key={product.id} className="hover:bg-slate-50 transition-colors border-b-slate-100">
                                        <TableCell className="font-medium text-slate-900 py-4">
                                            {product.name}
                                            {product.description && (
                                                <span className="block text-xs font-normal text-slate-500 mt-0.5">
                                                    {product.description}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-4 font-mono text-sm text-slate-600">{product.sku}</TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-slate-900">
                                                    {product.stockLevel} {product.unit}
                                                </span>
                                                {product.stockLevel <= 0 ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                                                        Out of Stock
                                                    </span>
                                                ) : product.stockLevel <= product.minStock ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                                                        Low Stock
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                                        In Stock
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 font-mono text-sm">{product.cost.toFixed(2)}</TableCell>
                                        <TableCell className="py-4 font-mono text-sm font-medium text-slate-900">{product.price.toFixed(2)}</TableCell>
                                        <TableCell className="text-right py-4">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setSelectedProduct(product);
                                                        setOpen(true);
                                                    }}
                                                    className="h-8 w-8 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(product.id)}
                                                    className="h-8 w-8 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <ProductDialog
                open={open}
                onOpenChange={setOpen}
                product={selectedProduct}
                onSave={() => fetchProducts(searchQuery)}
            />

            <ImportDialog
                open={importOpen}
                onOpenChange={setImportOpen}
                onSuccess={() => fetchProducts(searchQuery)}
            />
        </div>
    );
}
