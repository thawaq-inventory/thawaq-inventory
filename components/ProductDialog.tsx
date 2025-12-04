'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw } from "lucide-react";

interface Product {
    id?: string;
    name: string;
    sku: string;
    description?: string | null;
    stockLevel: number;
    unit: string;
    minStock: number;
    cost: number;
    price: number;
}

interface ProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product?: Product | null;
    onSave: () => void;
}

const UNITS = ['kg', 'g', 'L', 'ml', 'pcs', 'box', 'pack'];

const generateSKU = () => {
    // Generate a random 8-digit number
    return Math.floor(10000000 + Math.random() * 90000000).toString();
};

export function ProductDialog({ open, onOpenChange, product, onSave }: ProductDialogProps) {
    const t = useTranslations();
    const [formData, setFormData] = useState<Product>({
        name: '',
        sku: '',
        description: '',
        stockLevel: 0,
        unit: 'kg',
        minStock: 0,
        cost: 0,
        price: 0,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (product) {
            setFormData(product);
        } else {
            setFormData({
                name: '',
                sku: generateSKU(), // Auto-generate SKU for new items
                description: '',
                stockLevel: 0,
                unit: 'kg',
                minStock: 0,
                cost: 0,
                price: 0,
            });
        }
    }, [product, open]);

    const handleRegenerateSKU = () => {
        setFormData(prev => ({ ...prev, sku: generateSKU() }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = product?.id
                ? `/api/products/${product.id}`
                : '/api/products';
            const method = product?.id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                onSave();
                onOpenChange(false);
            }
        } catch (error) {
            console.error('Failed to save product:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            {product?.id ? t('Product.editProduct') : t('Product.addProduct')}
                        </DialogTitle>
                        <DialogDescription>
                            {product?.id
                                ? 'Update product information'
                                : 'Add a new product to your inventory'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                {t('Product.name')}
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="col-span-3"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="sku" className="text-right">
                                {t('Product.sku')}
                            </Label>
                            <div className="col-span-3 flex gap-2">
                                <Input
                                    id="sku"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                    className="flex-1"
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={handleRegenerateSKU}
                                    title="Regenerate SKU"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">
                                {t('Product.description')}
                            </Label>
                            <Input
                                id="description"
                                value={formData.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="col-span-3"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="stockLevel" className="text-right">
                                {t('Product.stockLevel')}
                            </Label>
                            <Input
                                id="stockLevel"
                                type="number"
                                step="0.01"
                                value={formData.stockLevel}
                                onChange={(e) => setFormData({ ...formData, stockLevel: parseFloat(e.target.value) || 0 })}
                                className="col-span-3"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="unit" className="text-right">
                                {t('Product.unit')}
                            </Label>
                            <Select
                                value={formData.unit}
                                onValueChange={(value) => setFormData({ ...formData, unit: value })}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {UNITS.map((unit) => (
                                        <SelectItem key={unit} value={unit}>
                                            {t(`Product.units.${unit}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="minStock" className="text-right">
                                {t('Product.minStock')}
                            </Label>
                            <Input
                                id="minStock"
                                type="number"
                                step="0.01"
                                value={formData.minStock}
                                onChange={(e) => setFormData({ ...formData, minStock: parseFloat(e.target.value) || 0 })}
                                className="col-span-3"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="cost" className="text-right">
                                {t('Product.cost')}
                            </Label>
                            <Input
                                id="cost"
                                type="number"
                                step="0.01"
                                value={formData.cost}
                                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                                className="col-span-3"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">
                                {t('Product.price')}
                            </Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                className="col-span-3"
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            {t('Common.cancel')}
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? t('Common.loading') : t('Common.save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
