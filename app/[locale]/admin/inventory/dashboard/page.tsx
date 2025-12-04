'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingDown, AlertTriangle, DollarSign } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Analytics {
    metrics: {
        totalProducts: number;
        lowStockItems: number;
        outOfStockItems: number;
        inStock: number;
        totalInventoryValue: number;
        totalRetailValue: number;
        profitPotential: number;
    };
    lowStockProducts: any[];
    categoryData: any[];
    valueDistribution: any[];
    stockDistribution: any[];
}

export default function InventoryDashboardPage() {
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await fetch('/api/analytics');
            const data = await response.json();
            setAnalytics(data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !analytics) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-slate-500">Loading analytics...</div>
            </div>
        );
    }

    const { metrics } = analytics;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory Analytics</h1>
                <p className="text-slate-500 mt-1">Overview of your inventory and stock levels</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                        <Package className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.totalProducts}</div>
                        <p className="text-xs text-slate-500 mt-1">
                            {metrics.inStock} in stock
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
                        <TrendingDown className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{metrics.lowStockItems}</div>
                        <p className="text-xs text-slate-500 mt-1">
                            Items need restocking
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{metrics.outOfStockItems}</div>
                        <p className="text-xs text-slate-500 mt-1">
                            Requires immediate action
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${metrics.totalInventoryValue.toFixed(0)}</div>
                        <p className="text-xs text-green-600 mt-1">
                            +${metrics.profitPotential.toFixed(0)} potential profit
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Stock Distribution Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Stock Distribution</CardTitle>
                        <CardDescription>Current inventory status breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={analytics.stockDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value }) => `${name}: ${value}`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {analytics.stockDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Value Products Bar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top 10 Products by Value</CardTitle>
                        <CardDescription>Highest value inventory items</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analytics.valueDistribution}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#3b82f6" name="Retail Value" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Low Stock Items Table */}
            {analytics.lowStockProducts.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Low Stock Items</CardTitle>
                        <CardDescription>Items that need immediate attention</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Product</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">SKU</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Current</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Minimum</th>
                                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Shortage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analytics.lowStockProducts.map((product, index) => (
                                        <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="py-3 px-4 text-sm text-slate-900">{product.name}</td>
                                            <td className="py-3 px-4 text-sm font-mono text-slate-600">{product.sku}</td>
                                            <td className="py-3 px-4 text-sm text-right text-amber-600 font-medium">
                                                {product.current} {product.unit}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-right text-slate-600">
                                                {product.minimum} {product.unit}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-right text-red-600 font-medium">
                                                -{(product.minimum - product.current).toFixed(1)} {product.unit}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
