/**
 * Talabat Sales Report Parser
 * 
 * Parses Talabat-specific CSV format with columns:
 * - Order Items: "2 Halloumi Cheese Sandwich [1 Add Tomato], 1 Kebab Sandwich"
 * - Subtotal: Revenue amount
 * - Order received at: Timestamp
 */

export interface TalabatItem {
    name: string;
    qty: number;
}

/**
 * Parse Talabat "Order Items" string
 * 
 * Example Input: "2 Halloumi Cheese Sandwich [1 Add Tomato], 1 Kebab Sandwich"
 * 
 * Logic:
 * 1. Split by comma to get individual items
 * 2. Extract quantity (leading number like "2 " or "1x ")
 * 3. Remove modifiers in brackets [...]
 * 4. Clean and trim the item name
 * 
 * @param orderItemsString - Raw string from Talabat CSV
 * @returns Array of parsed items with name and quantity
 */
export function parseTalabatItems(orderItemsString: string): TalabatItem[] {
    if (!orderItemsString || orderItemsString.trim() === '') {
        return [];
    }

    const items: TalabatItem[] = [];

    // Split by comma to get individual items
    const rawItems = orderItemsString.split(',');

    for (const rawItem of rawItems) {
        let cleaned = rawItem.trim();
        if (!cleaned) continue;

        // Extract quantity (matches patterns like "2 ", "1x ", "10 ", etc.)
        // Regex: ^(\d+)\s*x?\s* matches "2 ", "2x ", "2x", etc.
        const qtyMatch = cleaned.match(/^(\d+)\s*x?\s*/i);
        let qty = 1;

        if (qtyMatch) {
            qty = parseInt(qtyMatch[1], 10);
            // Remove the quantity prefix from the string
            cleaned = cleaned.substring(qtyMatch[0].length).trim();
        }

        // Remove modifiers in brackets [...] 
        // Example: "Halloumi Cheese Sandwich [1 Add Tomato]" → "Halloumi Cheese Sandwich"
        cleaned = cleaned.replace(/\[.*?\]/g, '').trim();

        // Final cleanup: remove extra spaces
        cleaned = cleaned.replace(/\s+/g, ' ').trim();

        if (cleaned) {
            items.push({
                name: cleaned,
                qty: qty
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
        input: "2 Halloumi Cheese Sandwich [1 Add Tomato], 1 Kebab Sandwich",
        expected: [
            { name: "Halloumi Cheese Sandwich", qty: 2 },
            { name: "Kebab Sandwich", qty: 1 }
        ]
    },
    {
        input: "1x Zinger Burger, 2x Fries [Large]",
        expected: [
            { name: "Zinger Burger", qty: 1 },
            { name: "Fries", qty: 2 }
        ]
    },
    {
        input: "3 Shawarma Wrap [Extra Garlic] [No Pickles], 1 Hummus",
        expected: [
            { name: "Shawarma Wrap", qty: 3 },
            { name: "Hummus", qty: 1 }
        ]
    }
];
