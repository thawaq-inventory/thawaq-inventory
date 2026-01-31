export interface ParsedItem {
    qty: number;
    name: string;
    modifiers: { qty: number; name: string }[];
}

/**
 * Parses a single line from the "Order Items" column.
 * Example: "2 Burger [1 Add Cheese, 1 Extra Patty], 1 Fries"
 */
export function parseSalesReportLine(line: string): ParsedItem[] {
    if (!line || typeof line !== 'string') return [];

    // 1. Split top-level items by comma, ignoring commas inside [...]
    // Regex explanation: Match a comma only if it's NOT followed by a character sequence ending in ] without a [ before it.
    // Actually, a simpler way for single-level brackets is: split by comma if not followed by a closing bracket that hasn't been matched by an opening one.
    // But given standard "Order Items" format, we can assume brackets are balanced.

    // A negative lookahead for ']' might work if we assume no commas after the last bracket? No.
    // Better approach: Match the pattern of an *Item*.
    // Item pattern: Number + Name + Optional [Modifiers]

    // Let's stick to the split regex which is standard for this:
    // Split by comma followed by even number of brackets? 
    // No, let's use the user's specific requirement logic:
    // "Split by commas only if they are NOT inside square brackets."

    const items = line.split(/,(?![^\[]*\])/).map(s => s.trim()).filter(s => s);

    const results: ParsedItem[] = [];

    for (const itemStr of items) {
        // Parse "2 Burger [1 Cheese]"
        // Regex: Start, (\d+), spaces, (Name), spaces, optional [ (Modifiers) ]
        const match = itemStr.match(/^(\d+)\s+(.*?)(?:\s*\[(.*)\])?$/);

        if (match) {
            const qty = parseInt(match[1], 10);
            const name = match[2].trim();
            const modifierContent = match[3];

            const modifiers: { qty: number; name: string }[] = [];

            if (modifierContent) {
                // Parse modifiers inside brackets: "1 Add Cheese, 1 Extra Patty"
                // These are comma separated.
                const modStrings = modifierContent.split(',').map(s => s.trim());
                for (const modStr of modStrings) {
                    // Regex for modifier: "1 Add Cheese"
                    // Sometimes just "Add Cheese" (qty 1 implied)? User said "Modifier Qty (1) + Name".
                    // We'll support both "1 Name" and "Name".
                    const modMatch = modStr.match(/^(\d+)\s+(.*)$/);
                    if (modMatch) {
                        modifiers.push({ qty: parseInt(modMatch[1], 10), name: modMatch[2].trim() });
                    } else {
                        // Implicit qty 1
                        modifiers.push({ qty: 1, name: modStr.trim() });
                    }
                }
            }

            results.push({ qty, name, modifiers });
        } else {
            // Fallback: Maybe just "Burger" (qty 1)? Or "1 Burger".
            // If no match found for strict "Qty Name", try liberal parse
            // Just assume 1 if no number
            results.push({ qty: 1, name: itemStr, modifiers: [] });
        }
    }

    return results;
}

/**
 * Parses TabSense "Items Breakdown" column.
 * - Items separated by \n (or \r\n)
 * - "Note:" indicates comments to be ignored (truncate line)
 * - Returns aggregated quantities
 */
export function parseTabSenseItems(itemsString: string): ParsedItem[] {
    if (!itemsString) return [];

    // itemsString example 1 (Standard): "1x Burger (Cheese), 2x Fries"
    // itemsString example 2 (Arabic/Simple): "ساندوش روست بيف, بطاطا, كولا Note: extra ice"

    const results: ParsedItem[] = [];

    // Strategy 1: Standard "Quantity x Name" format
    if (itemsString.match(/^\d+x/)) {
        // Split by comma, but verify it's not inside parens if possible.
        const parts = itemsString.split(/,\s*(?=\d+x)/); // Lookahead for next item start

        for (const part of parts) {
            const match = part.trim().match(/^(\d+)x\s+(.+)$/);
            if (match) {
                const qty = parseFloat(match[1]);
                const rawName = match[2];
                const nameParts = rawName.split('(');
                const baseName = nameParts[0].trim();

                const modifiers: { qty: number; name: string }[] = [];
                if (nameParts.length > 1) {
                    for (let i = 1; i < nameParts.length; i++) {
                        const modName = nameParts[i].replace(')', '').trim();
                        if (modName) {
                            modifiers.push({ qty: 1, name: modName });
                        }
                    }
                }

                results.push({
                    name: baseName,
                    qty: qty,
                    modifiers: modifiers
                });
            }
        }
    } else {
        // Strategy 2: Comma Separated String (Legacy/Arabic)
        // Split by comma
        // Handle newlines too just in case
        const separators = /[\n,]/;
        const parts = itemsString.split(separators);

        for (const p of parts) {
            let clean = p.trim();
            if (!clean) continue;

            // Handle "Note:" or "Notes:" suffix and strip it
            const noteIndex = clean.toLowerCase().indexOf('note:');
            if (noteIndex > -1) {
                clean = clean.substring(0, noteIndex).trim();
            }
            const notesIndex = clean.toLowerCase().indexOf('notes:');
            if (notesIndex > -1) {
                clean = clean.substring(0, notesIndex).trim();
            }

            // Strip parens
            clean = clean.split('(')[0].trim();

            if (clean) {
                // Improved parsing for Strategy 2: Check for "Qty Name" or "Qty x Name" pattern
                // Regex: Start with Number, optional space, optional 'x', then Name
                const qtyMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:[xX\*]\s*)?\s+(.+)$/);

                if (qtyMatch) {
                    results.push({
                        name: qtyMatch[2].trim(),
                        qty: parseFloat(qtyMatch[1]),
                        modifiers: []
                    });
                } else {
                    results.push({
                        name: clean,
                        qty: 1,
                        modifiers: []
                    });
                }
            }
        }
    }

    return results;
}
