import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseUpload } from '@/lib/parsers/file-parser';

// Expected normalized headers (Snake Case from CSV)
interface ProductImportRow {
    name: string;
    sku: string;
    category?: string;
    base_unit?: string;         // 'Grams', 'Piece'
    purchase_unit?: string;     // 'Box', 'Kg'
    conversion_factor?: string | number; // 1000, 12, 1
    purchase_price?: string | number;   // 5.00, 2.50
    display_name_ar?: string;  // Arabic Name
    arabic_name?: string;      // Variant
    display_name?: string;     // Variant
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // 1. Parse using Robust Parser
        const { data, errors } = await parseUpload<ProductImportRow>(file);

        if (errors.length > 0) {
            return NextResponse.json({ error: 'Parsing Failed', details: errors }, { status: 400 });
        }

        // 2. Fetch ALL Active Branches for Auto-Seeding
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

            if (!name && !sku) continue; // Skip if both missing

            // Fallback Name/SKU
            const finalSku = sku || name?.substring(0, 10).toUpperCase().replace(/\s+/g, '-') || 'UNK';
            const finalName = name || sku || 'Unknown Item';

            // Parse Numerics & Units
            const convFactor = row.conversion_factor ? Number(row.conversion_factor) : 1;
            const packPrice = row.purchase_price ? Number(row.purchase_price) : 0;
            const unit = row.base_unit || 'UNIT';
            const purchaseUnit = row.purchase_unit || 'PACK'; // Default to Pack if missing

            // Handle Arabic Name (Priority: Display_Name_AR > Arabic_Name > null)
            const arabicName = (
                row.display_name_ar ||
                row.arabic_name ||
                row.display_name ||
                null
            )?.toString().trim();

            // LOGIC ENGINE: Cost Calculation
            let calculatedCost = 0;
            if (packPrice > 0 && convFactor > 0) {
                calculatedCost = packPrice / convFactor;
            }

            try {
                // A. Upsert Product
                const product = await prisma.product.upsert({
                    where: { sku: finalSku },
                    update: {
                        name: finalName,
                        arabicName: arabicName || undefined, // Only update if new value provided
                        unit,
                        purchaseUnit,
                        conversionFactor: convFactor,
                        packPrice: packPrice, // Save Pack Price
                        cost: calculatedCost, // Save Calculated Unit Cost
                        description: row.category // Store Category as description
                    },
                    create: {
                        name: finalName,
                        arabicName,
                        sku: finalSku,
                        unit,
                        purchaseUnit,
                        conversionFactor: convFactor,
                        packPrice: packPrice,
                        cost: calculatedCost,
                        description: row.category
                    }
                });

                // B. Auto-Seed Inventory for ALL Branches
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
                errorDetails.push(`SKU ${finalSku}: ${e.message}`);
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
