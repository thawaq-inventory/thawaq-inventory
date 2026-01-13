import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { ProductionDialog } from '@/components/ProductionDialog';
import { ArrowLeftRight, Package, TrendingUp } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default async function InventoryPage() {
    const cookieStore = await cookies();
    const selectedBranchCookie = cookieStore.get('selectedBranches');
    let currentBranchId = null;
    let isKitchen = false;
    let branchName = 'Global View';

    if (selectedBranchCookie) {
        try {
            const branches = JSON.parse(selectedBranchCookie.value);
            if (branches && branches.length > 0 && branches[0] !== 'all') {
                currentBranchId = branches[0];
            }
        } catch (e) {
            console.error('Error parsing branch cookie', e);
        }
    }

    if (currentBranchId && currentBranchId !== 'HEAD_OFFICE') {
        const branch = await prisma.branch.findUnique({
            where: { id: currentBranchId },
            select: { id: true, name: true, type: true }
        });
        if (branch) {
            branchName = branch.name;
            isKitchen = branch.type === 'KITCHEN';
        }
    } else if (currentBranchId === 'HEAD_OFFICE') {
        branchName = 'Head Office';
    }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory Management</h1>
                    <p className="text-slate-500 mt-1">
                        {branchName} {isKitchen && <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full ml-2">Central Kitchen</span>}
                    </p>
                </div>
                {isKitchen && currentBranchId && (
                    <ProductionDialog branchId={currentBranchId} />
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                            <Package className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Total Products</h3>
                            <p className="text-slate-500 text-sm">Active Items</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                            <ArrowLeftRight className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Transfers</h3>
                            <p className="text-slate-500 text-sm">In Transit</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Value</h3>
                            <p className="text-slate-500 text-sm">Total Stock Value</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Placeholder for future widgets */}
            {!isKitchen && (
                <div className="bg-slate-50 rounded-xl p-12 text-center border border-dashed border-slate-300">
                    <p className="text-slate-500">Select "Products" from the sidebar to view detailed stock.</p>
                </div>
            )}

            {isKitchen && (
                <div className="bg-amber-50 rounded-xl p-8 border border-amber-200">
                    <h3 className="text-lg font-bold text-amber-900 mb-2">🧑‍🍳 Kitchen Operations</h3>
                    <p className="text-amber-700 mb-4">Use the "Record Production" button above to convert Raw Ingredients into Finished Goods.</p>
                    <ul className="list-disc pl-5 text-amber-800 space-y-1 text-sm">
                        <li>Ensure you have created Recipes first.</li>
                        <li>Stock of ingredients will be deducted automatically.</li>
                        <li>Finished goods will be added to this Kitchen's inventory.</li>
                    </ul>
                </div>
            )}
        </div>
    );
}
