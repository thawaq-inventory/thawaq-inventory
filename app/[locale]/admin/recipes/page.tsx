'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChefHat, Plus, TrendingUp, TrendingDown } from "lucide-react";

interface Recipe {
    id: string;
    name: string;
    category?: string;
    servingSize: number;
    targetCost?: number;
    sellingPrice?: number;
    currentCost: number;
    profitMargin: number | null;
    foodCostPercentage: number | null;
    ingredients: Array<{
        product: { name: string };
        quantity: number;
        unit: string;
    }>;
}

export default function RecipesPage() {
    const t = useTranslations('Admin');
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecipes();
    }, []);

    const fetchRecipes = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/recipes');
            const data = await res.json();
            setRecipes(data);
        } catch (error) {
            console.error('Error fetching recipes:', error);
        } finally {
            setLoading(false);
        }
    };

    const getProfitabilityColor = (foodCostPercentage: number | null) => {
        if (!foodCostPercentage) return 'text-slate-500';
        if (foodCostPercentage < 30) return 'text-green-600';
        if (foodCostPercentage < 35) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getProfitabilityLabel = (foodCostPercentage: number | null) => {
        if (!foodCostPercentage) return 'N/A';
        if (foodCostPercentage < 30) return 'Excellent';
        if (foodCostPercentage < 35) return 'Good';
        return 'High Cost';
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
                    <h1 className="text-3xl font-bold text-slate-900">Recipe Management</h1>
                    <p className="text-slate-500 mt-1">Manage recipes and calculate menu item costs</p>
                </div>
                <Button className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Recipe
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Recipes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{recipes.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Avg Food Cost %</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            {recipes.filter(r => r.foodCostPercentage).length > 0
                                ? (recipes.reduce((sum, r) => sum + (r.foodCostPercentage || 0), 0) / recipes.filter(r => r.foodCostPercentage).length).toFixed(1)
                                : '0.0'}%
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Profitable Recipes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {recipes.filter(r => r.foodCostPercentage && r.foodCostPercentage < 30).length}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Food cost &lt; 30%</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recipes Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {recipes.map((recipe) => (
                    <Card key={recipe.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white">
                                        <ChefHat className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{recipe.name}</CardTitle>
                                        {recipe.category && (
                                            <span className="text-xs text-slate-500 mt-1">{recipe.category}</span>
                                        )}
                                    </div>
                                </div>
                                {recipe.foodCostPercentage && (
                                    <div className={`text-right ${getProfitabilityColor(recipe.foodCostPercentage)}`}>
                                        <div className="text-sm font-bold">{recipe.foodCostPercentage.toFixed(1)}%</div>
                                        <div className="text-xs">{getProfitabilityLabel(recipe.foodCostPercentage)}</div>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Cost Breakdown */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                                <div>
                                    <div className="text-xs text-slate-500">Current Cost</div>
                                    <div className="text-lg font-bold text-slate-900">{recipe.currentCost.toFixed(2)} JOD</div>
                                </div>
                                {recipe.sellingPrice && (
                                    <div>
                                        <div className="text-xs text-slate-500">Selling Price</div>
                                        <div className="text-lg font-bold text-slate-900">{recipe.sellingPrice.toFixed(2)} JOD</div>
                                    </div>
                                )}
                            </div>

                            {/* Profit Margin */}
                            {recipe.profitMargin !== null && (
                                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg">
                                    <span className="text-sm font-medium text-slate-700">Profit Margin</span>
                                    <span className="text-lg font-bold text-green-600 flex items-center gap-1">
                                        {recipe.profitMargin > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        {recipe.profitMargin.toFixed(2)} JOD
                                    </span>
                                </div>
                            )}

                            {/* Ingredients */}
                            <div>
                                <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Ingredients ({recipe.ingredients.length})</div>
                                <div className="space-y-1">
                                    {recipe.ingredients.slice(0, 3).map((ing, index) => (
                                        <div key={index} className="text-sm text-slate-600 flex justify-between">
                                            <span>{ing.product.name}</span>
                                            <span className="text-slate-400">{ing.quantity} {ing.unit}</span>
                                        </div>
                                    ))}
                                    {recipe.ingredients.length > 3 && (
                                        <div className="text-xs text-slate-400">+{recipe.ingredients.length - 3} more</div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2">
                                <Button variant="outline" size="sm" className="flex-1">View Details</Button>
                                <Button variant="outline" size="sm" className="flex-1">Edit</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {recipes.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <ChefHat className="w-16 h-16 text-slate-300 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Recipes Yet</h3>
                        <p className="text-slate-500 mb-4">Create your first recipe to start tracking costs</p>
                        <Button className="bg-gradient-to-r from-teal-500 to-teal-600">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Recipe
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
