import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseUpload } from '@/lib/parsers/file-parser';

// Expected normalized headers
interface ProductImportRow {
    name: string;
    sku: string;
    category?: string;
    base_unit?: string;
    purchase_unit?: string;
    conversion_factor?: string | number;
    initial_cost?: string | number;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // 1. Parse using Robust Parser (returns normalized keys: 'name', 'sku', 'initial_cost' etc)
        const { data, errors } = await parseUpload<ProductImportRow>(file);

        if (errors.length > 0) {
            return NextResponse.json({ error: 'Parsing Failed', details: errors }, { status: 400 });
        }

        // 2. Fetch ALL Active Branches for Auto-Seeding (Global Scope Logic)
        // We do NOT require a branch_id from the client.
        const activeBranches = await prisma.branch.findMany({
            where: { isActive: true },
            select: { id: true, name: true }
        });

        let createdCount = 0;
        let errorCount = 0;
        const errorDetails: string[] = [];

        // 3. Loop and Process
        for (const row of data) {
            const name = row.name ? String(row.name).trim() : null;
            const sku = row.sku ? String(row.sku).trim() : null;

            if (!name || !sku) continue; // Skip empty rows

            // Parse Numerics
            const cost = row.initial_cost ? Number(row.initial_cost) : 0;
            const convFactor = row.conversion_factor ? Number(row.conversion_factor) : 1;
            const unit = row.base_unit || 'UNIT';
            const purchaseUnit = row.purchase_unit;

            try {
                // A. Upsert Product
                const product = await prisma.product.upsert({
                    where: { sku: sku },
                    update: {
                        name,
                        unit,
                        purchaseUnit,
                        conversionFactor: convFactor,
                        // If re-importing, we update the cost? 
                        // User said "Use Initial_Cost to set starting WAC". 
                        // Updating cost here effectively sets/resets it.
                        cost: cost,
                    },
                    create: {
                        name,
                        sku,
                        unit,
                        purchaseUnit,
                        conversionFactor: convFactor,
                        cost: cost,
                        description: row.category // Map Category to description for now
                    }
                });

                // B. Auto-Seed Inventory for ALL Branches
                // "Global Scope" Requirement: Create InventoryLevel if missing.
                const seedOps = [];
                for (const branch of activeBranches) {
                    seedOps.push(
                        prisma.inventoryLevel.upsert({
                            where: {
                                productId_branchId: { productId: product.id, branchId: branch.id }
                            },
                            create: {
                                productId: product.id,
                                branchId: branch.id,
                                quantityOnHand: 0,
                                reorderPoint: 0
                            },
                            update: {} // Do NOT overwrite existing stock levels
                        })
                    );
                }

                if (seedOps.length > 0) {
                    await prisma.$transaction(seedOps);
                }

                createdCount++;
            } catch (e: any) {
                errorCount++;
                errorDetails.push(`SKU ${sku}: ${e.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Imported ${createdCount} products. Seeded across ${activeBranches.length} branches.`,
            createdCount,
            errorCount,
            errorDetails
        });

    } catch (error: any) {
        console.error("Import API Error:", error);
        return NextResponse.json({ error: `Server Error: ${error.message}` }, { status: 500 });
    }
}
