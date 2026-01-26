// Logic is embedded below for quick testing without build steps.

// We need to use ts-node or just rename file to .js for quick testing if module import issues arise, 
// but let's try to run it with a simple harness.
// Actually, since I wrote it in TS, running it directly with 'node' might fail on imports/types.
// I'll rewrite this test script as a self-contained JS file for immediate verification without build step complications
// copying the logic briefly or using ts-node if available.

// Let's create a JS version of the test that includes the logic to avoid compilation steps for this quick check.

function splitOutsideBrackets(str) {
    const result = [];
    let current = '';
    let bracketDepth = 0;

    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === '[') bracketDepth++;
        else if (char === ']') bracketDepth--;

        if (char === ',' && bracketDepth === 0) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    if (current.trim()) result.push(current.trim());
    return result;
}

function parseItem(itemStr) {
    const regex = /^\s*(?:(\d+)\s+)?(.*?)\s*(?:\[(.*?)\])?$/;
    const match = itemStr.match(regex);
    if (!match) return { qty: 1, name: itemStr, modifiers: [] };

    const qty = match[1] ? parseInt(match[1], 10) : 1;
    const name = match[2].trim();
    const modifiersStr = match[3];
    const modifiers = [];

    if (modifiersStr) {
        const modifierParts = modifiersStr.split(',').map(s => s.trim());
        for (const mod of modifierParts) {
            const modRegex = /^\s*(?:(\d+)\s+)?(.*)$/;
            const modMatch = mod.match(modRegex);
            if (modMatch) {
                modifiers.push({
                    qty: modMatch[1] ? parseInt(modMatch[1], 10) : 1,
                    name: modMatch[2].trim()
                });
            } else {
                modifiers.push({ qty: 1, name: mod });
            }
        }
    }
    return { qty, name, modifiers };
}

function runTest(input) {
    console.log(`\nInput: "${input}"`);
    const parts = splitOutsideBrackets(input);
    parts.forEach(part => {
        const parsed = parseItem(part);
        console.log(`  -> Qty: ${parsed.qty}, Item: "${parsed.name}"`);
        if (parsed.modifiers.length > 0) {
            parsed.modifiers.forEach(m => console.log(`     - Mod: ${m.qty} x "${m.name}"`));
        }
    });
}

// Test Cases provided by User + Edge Cases
runTest("2 Burger [1 Add Cheese], 1 Fries");
runTest("1 Pizza [1 Extra Cheese, 1 Pepperoni]");
runTest("3 Spicy Zinger");
runTest("1 Combo Meal [1 Burger, 1 Fries, 1 Drink]");
runTest("2 Burger [1 Add Cheese], 1 Fries [1 No Salt]");
