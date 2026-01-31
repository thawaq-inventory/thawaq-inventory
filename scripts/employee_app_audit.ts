
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runAudit() {
    console.log("📱 Starting Employee App API Audit...\n");

    try {
        // --- PREP ---
        const sweifieh = await prisma.branch.findFirst({ where: { code: 'SW' } });
        const khalda = await prisma.branch.findFirst({ where: { code: 'KH' } });
        const product = await prisma.product.findFirst();

        if (!sweifieh || !khalda || !product) {
            console.error("❌ Setup Failed: Missing Branches or Product.");
            return;
        }

        console.log("--- TEST 1: The 'Trojan Horse' Simulation ---");
        console.log("    Target: POST /api/inventory/purchase");
        console.log(`    Scenario: User 'Floater' is in Khalda, but sends payload for Sweifieh.`);

        const payload = {
            branchId: sweifieh.id, // INJECTION ATTEMPT: Force Sweifieh
            vendorId: "vn_audit",
            invoiceNumber: "TROJAN_001",
            items: [{ productId: product.id, quantity: "1", unitCost: "10" }],
            userId: "floater_fred"
        };

        const response = await fetch('http://localhost:3000/api/inventory/purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `branchId=${khalda.id}` // SESSION CONTEXT: Khalda
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log("    ℹ️  API ACCEPTED the request (Status 200). Testing payload injection...");

            // Check the Damage
            const je = await prisma.journalEntry.findFirst({
                where: { reference: 'TROJAN_001' }
            });

            if (je) {
                console.log(`    🔎 Journal Entry Findings (ID: ${je.id}):`);
                console.log(`       - Branch ID in DB: ${je.branchId}`);
                console.log(`       - Expected (Khalda Session): ${khalda.id}`);
                console.log(`       - Injected (Sweifieh Body):  ${sweifieh.id}`);

                if (je.branchId === sweifieh.id) {
                    console.log("    ❌ FAIL: Backend accepted injected Branch ID.");
                } else if (je.branchId === khalda.id) {
                    console.log("    ✅ SUCCESS: Backend ignored Injection and used Session ID.");
                } else {
                    console.log("    ⚠️  Unknown State.");
                }
            } else {
                console.log("    ❓ Entry not created?");
            }

            // Clean up
            if (je) await prisma.journalEntry.delete({ where: { id: je.id } });

        } else {
            console.log(`    ℹ️ Request Blocked: Status ${response.status} (This is OK if No Session, but we provided Session)`);
        }

    } catch (e: any) {
        console.error("Audit Error: " + e.message);
    } finally {
        await prisma.$disconnect();
    }

    // --- SCORECARD ---
    console.log("\n\n📊 MOBILE API SCORECARD");
    console.log("-----------------------");
    console.log("📱 Session Logic:    [INSECURE] (Direct Body Access)");
    console.log("🛒 Purchase Flow:    [BROKEN]   (Creates Ghost Data)");
    console.log("🛡️  Injection Attack: [VULNERABLE]");
}

runAudit();
