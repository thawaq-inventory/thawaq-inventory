'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Plus, Package } from "lucide-react";

interface ProductionBatch {
    id: string;
    outputProduct: { name: string };
    quantityProduced: number;
    recipe?: { name: string };
    ingredients: Array<{
        product: { name: string };
        quantityUsed: number;
    }>;
    notes?: string;
    createdAt: string;
}

export default function ProductionPage() {
    const [batches, setBatches] = useState<ProductionBatch[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBatches();
    }, []);

    const fetchBatches = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/production');
            const data = await res.json();
            setBatches(data);
        } catch (error) {
            console.error('Error fetching production batches:', error);
        } finally {
            setLoading(false);
        }
    };

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
                    <h1 className="text-3xl font-bold text-slate-900">Production Log</h1>
                    <p className="text-slate-500 mt-1">Track prep work and production batches</p>
                </div>
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Log Production
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Batches</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{batches.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Today's Production</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {batches.filter(b => new Date(b.createdAt).toDateString() === new Date().toDateString()).length}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Batches logged today</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Recipe-Based</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            {batches.filter(b => b.recipe).length}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Following recipes</p>
                    </CardContent>
                </Card>
            </div>

            {/* Production Batches */}
            <div className="space-y-4">
                {batches.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Flame className="w-16 h-16 text-slate-300 mb-4" />
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Production Logged</h3>
                            <p className="text-slate-500 mb-4">Start logging your prep work and production batches</p>
                            <Button className="bg-gradient-to-r from-orange-500 to-orange-600">
                                <Plus className="w-4 h-4 mr-2" />
                                Log Production
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    batches.map((batch) => (
                        <Card key={batch.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white">
                                            <Flame className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{batch.outputProduct.name}</CardTitle>
                                            {batch.recipe && (
                                                <CardDescription className="mt-1">
                                                    Recipe: {batch.recipe.name}
                                                </CardDescription>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-orange-600">
                                            {batch.quantityProduced} units
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {new Date(batch.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div>
                                    <div className="text-xs font-semibold text-slate-500 uppercase mb-2">
                                        Ingredients Used ({batch.ingredients.length})
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {batch.ingredients.map((ing, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                                                <span className="text-sm text-slate-700 flex items-center gap-2">
                                                    <Package className="w-4 h-4 text-slate-400" />
                                                    {ing.product.name}
                                                </span>
                                                <span className="text-sm font-medium text-slate-900">
                                                    {ing.quantityUsed} units
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {batch.notes && (
                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                        <div className="text-xs font-semibold text-blue-900 mb-1">Notes</div>
                                        <p className="text-sm text-blue-700">{batch.notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
