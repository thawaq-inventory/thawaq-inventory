'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import Papa from 'papaparse';

interface ImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function ImportDialog({ open, onOpenChange, onSuccess }: ImportDialogProps) {
    const t = useTranslations();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    try {
                        const response = await fetch('/api/products/bulk', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ products: results.data }),
                        });

                        const data = await response.json();

                        if (response.ok) {
                            onSuccess();
                            onOpenChange(false);
                        } else {
                            setError(data.error || 'Import failed');
                        }
                    } catch (err) {
                        setError('Failed to import products');
                    } finally {
                        setLoading(false);
                    }
                },
                error: (err) => {
                    setError(`CSV parsing error: ${err.message}`);
                    setLoading(false);
                },
            });
        } catch (err) {
            setError('Failed to read file');
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{t('Admin.import')}</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file to import products. SKUs will be automatically generated for items without them.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-slate-300 transition-colors">
                        <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                        <p className="text-sm text-slate-600 mb-4">
                            Click to select a CSV file or drag and drop
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <Button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={loading}
                        >
                            {loading ? 'Importing...' : 'Select CSV File'}
                        </Button>
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                        <h4 className="font-medium text-sm text-slate-900 mb-2">CSV Format:</h4>
                        <p className="text-xs text-slate-600 mb-2">
                            Required columns: <code className="bg-white px-1 py-0.5 rounded">name</code>
                        </p>
                        <p className="text-xs text-slate-600">
                            Optional: <code className="bg-white px-1 py-0.5 rounded">sku</code>,
                            <code className="bg-white px-1 py-0.5 rounded ml-1">description</code>,
                            <code className="bg-white px-1 py-0.5 rounded ml-1">stockLevel</code>,
                            <code className="bg-white px-1 py-0.5 rounded ml-1">unit</code>,
                            <code className="bg-white px-1 py-0.5 rounded ml-1">minStock</code>,
                            <code className="bg-white px-1 py-0.5 rounded ml-1">cost</code>,
                            <code className="bg-white px-1 py-0.5 rounded ml-1">price</code>
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        {t('Common.cancel')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
