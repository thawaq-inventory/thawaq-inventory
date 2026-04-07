import { ParsedItem } from './sales-report-parser';

/**
 * Talabat Sales Report Parser
 * 
 * Parses Talabat-specific CSV format with columns:
 * - Order Items: "2 Halloumi Cheese Sandwich [1 Add Tomato], 1 Kebab Sandwich"
 * - Subtotal: Revenue amount
 * - Order received at: Timestamp
 */

/**
 * Parse Talabat "Order Items" string
 * 
 * Example Input: "2 Halloumi Cheese Sandwich [1 Add Tomato, Add Zaatar], 1 Kebab Sandwich"
 * 
 * Logic:
 * 1. Split by comma (ignoring commas inside brackets) to get individual items
 * 2. Extract quantity (leading number like "2 " or "1x ")
 * 3. Extract modifiers in brackets [...]
 * 4. Clean and trim the item name and modifier names
 * 
 * @param orderItemsString - Raw string from Talabat CSV
 * @returns Array of parsed items with name, quantity, and modifiers
 */
export function parseTalabatItems(orderItemsString: string): ParsedItem[] {
    if (!orderItemsString || orderItemsString.trim() === '') {
        return [];
    }

    const items: ParsedItem[] = [];

    // Split by comma, ignoring commas inside [...]
    const rawItems = orderItemsString.split(/,(?![^\[]*\])/).map(s => s.trim()).filter(Boolean);

    for (const rawItem of rawItems) {
        let cleaned = rawItem;
        let qty = 1;

        // Matches strings like "2 ", "2x ", "10 x " etc.
        const qtyMatch = cleaned.match(/^(\d+)\s*x?\s*/i);
        if (qtyMatch) {
            qty = parseInt(qtyMatch[1], 10);
            cleaned = cleaned.substring(qtyMatch[0].length).trim();
        }

        const modifiers: { qty: number; name: string }[] = [];

        // Now see if there are modifiers: ... [mod1, mod2]
        const modMatch = cleaned.match(/(.*)\[(.*)\]\s*$/);
        let namePart = cleaned;
        
        if (modMatch) {
            namePart = modMatch[1].trim();
            const modString = modMatch[2];
            
            const modParts = modString.split(',').map(s => s.trim()).filter(Boolean);
            for (const mod of modParts) {
                const mQtyMatch = mod.match(/^(\d+)\s*x?\s*/i);
                let mQty = 1;
                let mName = mod;
                if (mQtyMatch) {
                    mQty = parseInt(mQtyMatch[1], 10);
                    mName = mod.substring(mQtyMatch[0].length).trim();
                }
                
                modifiers.push({ qty: mQty, name: mName });
            }
        }

        // Final cleanup
        namePart = namePart.replace(/\s+/g, ' ').trim();

        if (namePart) {
            items.push({
                name: namePart,
                qty: qty,
                modifiers: modifiers
            });
        }
    }

    return items;
}

/**
 * Test cases (for reference/documentation)
 */
export const TALABAT_PARSER_TESTS = [
    {
        input: "2 Halloumi Cheese Sandwich [1 Add Tomato, Add Zaatar], 1 Kebab Sandwich",
        expected: [
            { 
                name: "Halloumi Cheese Sandwich", qty: 2, 
                modifiers: [{name: "Add Tomato", qty: 1}, {name: "Add Zaatar", qty: 1}]
            },
            { name: "Kebab Sandwich", qty: 1, modifiers: [] }
        ]
    },
    {
        input: "1x Zinger Burger, 2x Fries [Large]",
        expected: [
            { name: "Zinger Burger", qty: 1, modifiers: [] },
            { name: "Fries", qty: 2, modifiers: [{name: "Large", qty: 1}] }
        ]
    },
    {
        input: "3 Shawarma Wrap [2 Extra Garlic] [No Pickles], 1 Hummus",
        expected: [
            { 
                name: "Shawarma Wrap [2 Extra Garlic]", qty: 3, 
                modifiers: [{name: "No Pickles", qty: 1}] 
            },
            { name: "Hummus", qty: 1, modifiers: [] }
        ]
    }
];
