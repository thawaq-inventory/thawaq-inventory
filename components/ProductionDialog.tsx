'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChefHat, AlertTriangle } from 'lucide-react';

interface Recipe {
    id: string;
    name: string;
    ingredients: any[];
}

export function ProductionDialog({ branchId }: { branchId: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [selectedRecipeId, setSelectedRecipeId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            fetchRecipes();
        }
    }, [open]);

    const fetchRecipes = async () => {
        try {
            const res = await fetch('/api/recipes');
            const data = await res.json();
            setRecipes(data);
        } catch (err) {
            console.error('Failed to fetch recipes', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const recipe = recipes.find(r => r.id === selectedRecipeId);
            if (!recipe) return;

            // Prepare payload
            // We need outputProductId. Assuming Recipe data includes it or we map it.
            // Wait, the Recipe model doesn't explicitly link to an 'outputProduct' in the schema I saw?
            // Let's check schema again. 
            // Schema has `Recipe` and `RecipeIngredient`. 
            // `ProductionBatch` has `outputProductId`.
            // Does Recipe have `outputProductId`? 
            // Looking at schema: `Recipe` has `ingredients`. It doesn't seem to link updates to a specific Product ID as output?
            // Ah, usually a Recipe IS a product. 
            // Or `Recipe` is metadata for a Product.
            // Let's assume for this MVP that the User selects a "Product" to produce, and that Product has a Recipe.
            // OR: The Recipe ID *is* linked to a Product.
            // Let's check `ProductionBatch` schema: `recipeId` (optional), `outputProductId` (required).

            // Allow user to select a Recipe. We need to know what Product it allows us to make.
            // If the schema is missing that link, I might need to ask the user or just assume logic.
            // Let's assume for now the user selects the "Finished Good" (Product), and we find the recipe for it.
            // OR: The Recipe *Name* matches the Product *Name*.

            // CRITICAL: Schema constraint.
            // Let's just pass `outputProductId` if possible. 
            // For now, I'll iterate: User selects Recipe. I need to find the Product that this Recipe makes.
            // Simple hack: We'll add `outputProductId` to the modal input or assume it's passed.
            // Let's look at `api/recipes` response.

            // Temporary: I will assume the Recipe selection allows me to pick the product.
            // Logic: `POST /api/production` needs `outputProductId`.

            // I will add a dropdown to select "Product to Produce" instead of "Recipe".
            // Then fetch the recipe for that product.

            // ACTUALLY: The user request said "Select Product (e.g. Marinated Chicken)".
            // So: Fetch Products.

        } catch (err: any) {
            setError(err.message || 'Failed to record production');
        } finally {
            setLoading(false);
        }
    };

    // ... rendering ...
    return null; // Logic placeholder
}
