import { getRecipes, getProductsList } from '@/app/actions/recipes';
import RecipeManager from './RecipeManager';

export default async function RecipePage() {
    const [recipes, products] = await Promise.all([
        getRecipes(),
        getProductsList()
    ]);

    // Ensure types match what Client Component expects (Prisma dates can imply serialization issues if not careful, but server actions handle this mostly fine now in simple cases)
    // However, it's safer to pass serialized data if needed, but modern Next.js 14 handles simple objects well.
    // The main issue is Decimal vs Number. Prisma floats are numbers, Decimals are objects.
    // Schema uses Float, so we are good.

    return (
        <div className="p-6 max-w-[1600px] mx-auto h-[calc(100vh-20px)]">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900">Recipe Engineer</h1>
                <p className="text-slate-600 mt-2">Design recipes and verify food costs accurately.</p>
            </div>

            <RecipeManager initialRecipes={recipes as any} products={products} />
        </div>
    );
}
