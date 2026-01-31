'use client';

import { useTranslations } from 'next-intl';
import { Scanner } from '@/components/Scanner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useProductName, useUnitName } from '@/hooks/use-localization';

export default function ScanPage() {
    const t = useTranslations('Employee');
    const router = useRouter();
    const [lastScanned, setLastScanned] = useState<string | null>(null);
    const [scannedProduct, setScannedProduct] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleScanSuccess = async (decodedText: string) => {
        if (decodedText === lastScanned) return;

        setLastScanned(decodedText);
        setIsLoading(true);
        setError(null);
        setScannedProduct(null);

        try {
            const response = await fetch(`/api/products?sku=${encodeURIComponent(decodedText)}`);
            if (!response.ok) throw new Error('Failed to fetch product');

            const products = await response.json();
            if (products.length > 0) {
                setScannedProduct(products[0]);
            } else {
                setError(t('productNotFound'));
            }
        } catch (err) {
            console.error('Error fetching product:', err);
            setError(t('errorScanning'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-6 bg-slate-50">
            <div className="max-w-2xl w-full mx-auto">
                <Button
                    variant="ghost"
                    className="mb-6 pl-0 hover:bg-transparent hover:text-slate-900 text-slate-600"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('backToDashboard')}
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('scanItem')}</CardTitle>
                        <CardDescription>{t('scanItemDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Scanner onScanSuccess={handleScanSuccess} />

                        {isLoading && (
                            <div className="mt-6 text-center text-slate-500">
                                <p>{t('loading')}...</p>
                            </div>
                        )}

                        {error && (
                            <div className="mt-6 p-4 border border-red-200 bg-red-50 rounded-lg text-red-700 text-center">
                                <p>{error}</p>
                                <p className="text-sm mt-1 text-red-600">Scanned: {lastScanned}</p>
                            </div>
                        )}

                        {scannedProduct && (
                            <div className="mt-6 p-6 border rounded-xl bg-white shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">{useProductName(scannedProduct)}</h3>
                                        <p className="text-slate-500 font-mono text-sm">{scannedProduct.sku}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-slate-900">{scannedProduct.price} SAR</p>
                                        <p className="text-sm text-slate-500">{t('currentStock')}: {scannedProduct.stockLevel} {useUnitName(scannedProduct.unit)}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-6">
                                    <Button
                                        onClick={() => router.push(`/employee/receiving?sku=${scannedProduct.sku}`)}
                                        className="w-full"
                                    >
                                        {t('receiveStock')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => router.push(`/employee/count?sku=${scannedProduct.sku}`)}
                                        className="w-full"
                                    >
                                        {t('stockCount')}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
