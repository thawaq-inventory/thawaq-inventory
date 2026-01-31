import { prisma } from '../lib/prisma';
import { generateArabicName } from '../lib/utils/arabic-translation';

/**
 * Migration Script: Populate Arabic Names
 * 
 * Backfills arabicName field for all existing products
 * based on SKU prefix mapping rules
 */

async function main() {
    console.log('🚀 Starting Arabic name population...\n');

    // Fetch ALL products to regenerate Arabic names with updated mappings
    const products = await prisma.product.findMany({
        orderBy: { sku: 'asc' }
    });

    console.log(`Found ${products.length} products to update\n`);

    let updated = 0;
    let skipped = 0;

    for (const product of products) {
        try {
            const arabicName = generateArabicName(product.sku || '', product.name);

            await prisma.product.update({
                where: { id: product.id },
                data: { arabicName }
            });

            console.log(`✓ ${product.sku?.padEnd(20)} → ${arabicName}`);
            updated++;

        } catch (error: any) {
            console.error(`✗ Failed to update ${product.sku}: ${error.message}`);
            skipped++;
        }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
}

main()
    .catch((e) => {
        console.error('❌ Migration failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
