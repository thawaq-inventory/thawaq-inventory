'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Target, Calendar } from "lucide-react";

interface FoodCostData {
    period: { startDate: string; endDate: string };
    summary: {
        totalPurchaseCost: number;
        totalWasteCost: number;
        totalCost: number;
        totalSales: number;
        foodCostPercentage: number;
        targetFoodCostPercentage: number;
        variance: number;
    };
    dailyTrend: Array<{
        date: string;
        purchaseCost: number;
        wasteCost: number;
        sales: number;
        foodCostPercentage: number;
    }>;
}

export default function FoodCostAnalyticsPage() {
    const [data, setData] = useState<FoodCostData | null>(null);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams(dateRange);
            const res = await fetch(`/api/analytics/food-cost?${params}`);
            const result = await res.json();
            setData(result);
        } catch (error) {
            console.error('Error fetching food cost data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !data) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-slate-500">Loading...</div>
            </div>
        );
    }

    const { summary } = data;
    const isOverTarget = summary.foodCostPercentage > summary.targetFoodCostPercentage;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Food Cost Analytics</h1>
                    <p className="text-slate-500 mt-1">Track and optimize your restaurant's food cost percentage</p>
                </div>
                <Button
                    onClick={fetchData}
                    variant="outline"
                    className="gap-2"
                >
                    <Calendar className="w-4 h-4" />
                    Refresh
                </Button>
            </div>

            {/* Main Food Cost Card */}
            <Card className="border-2 border-slate-200">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl">Food Cost Percentage</CardTitle>
                            <CardDescription className="mt-1">
                                {new Date(data.period.startDate).toLocaleDateString()} - {new Date(data.period.endDate).toLocaleDateString()}
                            </CardDescription>
                        </div>
                        <div className="text-right">
                            <div className={`text-5xl font-bold ${isOverTarget ? 'text-red-600' : 'text-green-600'}`}>
                                {summary.foodCostPercentage.toFixed(1)}%
                            </div>
                            <div className="flex items-center gap-2 justify-end mt-2">
                                {isOverTarget ? (
                                    <TrendingUp className="w-5 h-5 text-red-500" />
                                ) : (
                                    <TrendingDown className="w-5 h-5 text-green-500" />
                                )}
                                <span className={`text-sm font-medium ${isOverTarget ? 'text-red-600' : 'text-green-600'}`}>
                                    {Math.abs(summary.variance).toFixed(1)}% {isOverTarget ? 'over' : 'under'} target
                                </span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-6 p-4 bg-slate-50 rounded-lg">
                        <div>
                            <div className="text-xs text-slate-500 mb-1">Total Cost</div>
                            <div className="text-xl font-bold text-slate-900">{summary.totalCost.toFixed(2)} JOD</div>
                            <div className="text-xs text-slate-500 mt-1">
                                Purchases: {summary.totalPurchaseCost.toFixed(2)} JOD
                            </div>
                            <div className="text-xs text-slate-500">
                                Waste: {summary.totalWasteCost.toFixed(2)} JOD
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 mb-1">Total Sales</div>
                            <div className="text-xl font-bold text-slate-900">{summary.totalSales.toFixed(2)} JOD</div>
                            <div className="text-xs text-slate-500 mt-1">
                                Estimated from data
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 mb-1">Target</div>
                            <div className="text-xl font-bold text-blue-600">{summary.targetFoodCostPercentage}%</div>
                            <div className="text-xs text-slate-500 mt-1">
                                Industry standard
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Cost Breakdown</CardTitle>
                        <CardDescription>Composition of food costs</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <span className="text-sm font-medium text-slate-700">Purchase Costs</span>
                            <div className="text-right">
                                <div className="font-bold text-blue-600">{summary.totalPurchaseCost.toFixed(2)} JOD</div>
                                <div className="text-xs text-slate-500">
                                    {((summary.totalPurchaseCost / summary.totalCost) * 100).toFixed(1)}% of total
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                            <span className="text-sm font-medium text-slate-700">Waste Costs</span>
                            <div className="text-right">
                                <div className="font-bold text-red-600">{summary.totalWasteCost.toFixed(2)} JOD</div>
                                <div className="text-xs text-slate-500">
                                    {((summary.totalWasteCost / summary.totalCost) * 100).toFixed(1)}% of total
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Performance Indicators</CardTitle>
                        <CardDescription>Key metrics for the period</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-sm font-medium text-slate-700">Avg Daily Cost</span>
                            <span className="font-bold text-slate-900">
                                {(summary.totalCost / data.dailyTrend.length).toFixed(2)} JOD
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-sm font-medium text-slate-700">Avg Daily Sales</span>
                            <span className="font-bold text-slate-900">
                                {(summary.totalSales / data.dailyTrend.length).toFixed(2)} JOD
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-sm font-medium text-slate-700">Best Day Food Cost %</span>
                            <span className="font-bold text-green-600">
                                {Math.min(...data.dailyTrend.map(d => d.foodCostPercentage)).toFixed(1)}%
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Daily Trend */}
            <Card>
                <CardHeader>
                    <CardTitle>Daily Food Cost Trend</CardTitle>
                    <CardDescription>Daily food cost percentage over the selected period</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {data.dailyTrend.slice(-7).reverse().map((day, index) => (
                            <div key={index} className="flex items-center gap-4 p-3 border border-slate-200 rounded-lg">
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-slate-900">
                                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        Cost: {(day.purchaseCost + day.wasteCost).toFixed(2)} JOD | Sales: {day.sales.toFixed(2)} JOD
                                    </div>
                                </div>
                                <div className={`text-lg font-bold ${day.foodCostPercentage > summary.targetFoodCostPercentage ? 'text-red-600' : 'text-green-600'}`}>
                                    {day.foodCostPercentage.toFixed(1)}%
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
