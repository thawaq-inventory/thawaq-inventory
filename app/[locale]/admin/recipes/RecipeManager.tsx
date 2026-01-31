'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, X, ChefHat, Search, ArrowRight } from "lucide-react";
import { createRecipe, updateRecipe, deleteRecipe, addIngredient, removeIngredient, updateIngredient } from '@/app/actions/recipes';
import { ProductCombobox } from "@/components/inventory/ProductCombobox";

interface Recipe {
    id: string;
    name: string;
    servingSize: number;
    ingredients: {
        id: string;
        quantity: number;
        unit: string;
        product: {
            id: string;
            name: string;
            cost: number;
            unit: string;
        }
    }[];
}

interface Product {
    id: string;
    name: string;
    unit: string;
    cost: number;
}

export default function RecipeManager({ initialRecipes, products }: { initialRecipes: Recipe[], products: Product[] }) {
    const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
    const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [newRecipeName, setNewRecipeName] = useState('');

    // Ingredient Form State
    const [newIngProductId, setNewIngProductId] = useState('');
    const [newIngQty, setNewIngQty] = useState('');

    const selectedRecipe = recipes.find(r => r.id === selectedRecipeId);

    // Derived State: Cost
    const totalCost = selectedRecipe?.ingredients.reduce((sum, ing) => sum + (ing.quantity * ing.product.cost), 0) || 0;

    // Filter recipes locally
    const filteredRecipes = recipes.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const handleCreateRecipe = async () => {
        if (!newRecipeName.trim()) return;
        const result = await createRecipe({ name: newRecipeName });
        if (result.success && result.recipe) {
            // Refresh page or update local state properly
            window.location.reload();
        }
    };

    const handleDeleteRecipe = async (id: string) => {
        if (!confirm("Delete this recipe?")) return;
        const res = await deleteRecipe(id);
        if (res.success) {
            setRecipes(recipes.filter(r => r.id !== id));
            if (selectedRecipeId === id) setSelectedRecipeId(null);
        }
    };

    const handleAddIngredient = async () => {
        if (!selectedRecipeId || !newIngProductId || !newIngQty) return;
        const product = products.find(p => p.id === newIngProductId);
        if (!product) return;

        const qty = parseFloat(newIngQty);
        if (isNaN(qty)) return;

        const res = await addIngredient(selectedRecipeId, newIngProductId, qty, product.unit);
        if (res.success) {
            window.location.reload(); // Simple refresh to show new ingredient
        }
    };

    const handleRemoveIngredient = async (ingId: string) => {
        const res = await removeIngredient(ingId);
        if (res.success) {
            window.location.reload();
        }
    };

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6">
            {/* LEFT SIDEBAR: RECIPE LIST */}
            <div className="w-1/3 flex flex-col gap-4 min-w-[300px]">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Search recipes..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button size="icon" onClick={() => setIsCreating(true)} variant="outline">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>

                {isCreating && (
                    <Card className="p-4 bg-blue-50 border-blue-200">
                        <div className="space-y-3">
                            <Label>New Recipe Name</Label>
                            <Input
                                value={newRecipeName}
                                onChange={(e) => setNewRecipeName(e.target.value)}
                                autoFocus
                            />
                            <div className="flex gap-2 justify-end">
                                <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                                <Button size="sm" onClick={handleCreateRecipe}>Create</Button>
                            </div>
                        </div>
                    </Card>
                )}

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {filteredRecipes.map(recipe => (
                        <div
                            key={recipe.id}
                            onClick={() => setSelectedRecipeId(recipe.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-slate-50 ${selectedRecipeId === recipe.id ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400' : 'bg-white border-slate-200'
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-semibold text-slate-900">{recipe.name}</div>
                                    <div className="text-xs text-slate-500">{recipe.ingredients.length} items</div>
                                </div>
                                {selectedRecipeId === recipe.id && (
                                    <ArrowRight className="h-4 w-4 text-blue-500 mt-1" />
                                )}
                            </div>
                        </div>
                    ))}
                    {filteredRecipes.length === 0 && !isCreating && (
                        <div className="text-center py-8 text-slate-400">No recipes found</div>
                    )}
                </div>
            </div>

            {/* RIGHT MAIN: DETAIL VIEW */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {selectedRecipe ? (
                    <Card className="h-full flex flex-col border-slate-200 shadow-sm">
                        <CardHeader className="border-b bg-slate-50 pb-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-2xl">{selectedRecipe.name}</CardTitle>
                                    <CardDescription>
                                        Serving Size: {selectedRecipe.servingSize} unit(s)
                                    </CardDescription>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-slate-500">Total Cost</div>
                                    <div className="text-2xl font-bold text-green-700">{totalCost.toFixed(3)} JOD</div>
                                    <div className="text-xs text-slate-400">Verified Cost</div>
                                </div>
                            </div>
                        </CardHeader>

                        <div className="flex-1 overflow-y-auto p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Ingredient</TableHead>
                                        <TableHead className="w-[100px]">Qty</TableHead>
                                        <TableHead className="w-[100px]">Unit</TableHead>
                                        <TableHead className="w-[100px] text-right">Cost</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedRecipe.ingredients.map((ing) => (
                                        <TableRow key={ing.id}>
                                            <TableCell className="font-medium">{ing.product.name}</TableCell>
                                            <TableCell>{ing.quantity}</TableCell>
                                            <TableCell className="text-slate-500 text-xs">{ing.unit}</TableCell>
                                            <TableCell className="text-right">
                                                {(ing.quantity * ing.product.cost).toFixed(3)}
                                            </TableCell>
                                            <TableCell>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:text-red-700" onClick={() => handleRemoveIngredient(ing.id)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {selectedRecipe.ingredients.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-slate-400 italic">
                                                No ingredients yet. Add items below to calculate cost.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* ADD INGREDIENT FOOTER */}
                        <div className="p-4 border-t bg-slate-50 space-y-3">
                            <Label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Add Ingredient</Label>
                            <div className="flex gap-3 items-end">
                                <div className="flex-1">
                                    <ProductCombobox
                                        products={products}
                                        onSelect={setNewIngProductId}
                                    />
                                </div>
                                <div className="w-[100px]">
                                    <Input
                                        placeholder="Qty"
                                        type="number"
                                        step="0.001"
                                        value={newIngQty}
                                        onChange={(e) => setNewIngQty(e.target.value)}
                                    />
                                </div>
                                <Button onClick={handleAddIngredient} disabled={!newIngProductId || !newIngQty}>
                                    <Plus className="h-4 w-4 mr-2" /> Add
                                </Button>
                            </div>
                        </div>

                        <div className="p-2 border-t flex justify-between items-center bg-white">
                            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteRecipe(selectedRecipe.id)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Recipe
                            </Button>
                            <div className="text-xs text-slate-400">
                                Auto-save enabled
                            </div>
                        </div>
                    </Card>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 border rounded-lg border-dashed border-slate-300 m-1 bg-slate-50">
                        <ChefHat className="h-16 w-16 mb-4 text-slate-300" />
                        <h3 className="text-lg font-medium text-slate-600">Select a Recipe</h3>
                        <p>Select a recipe from the sidebar or verify costs.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
