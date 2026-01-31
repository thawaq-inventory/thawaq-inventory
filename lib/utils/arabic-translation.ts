/**
 * Arabic Translation Utility
 * 
 * Generates Arabic display names for products based on SKU prefixes
 * Implements the "Translation Map" logic for inventory items
 */

/**
 * Common SKU suffix to Arabic transliteration mapping
 * Add more mappings as you discover them in your inventory
 */
const SUFFIX_MAP: Record<string, string> = {
    // Bread types
    'SHRAK': 'شراك',
    'PITA': 'بيتا',
    'BAGUETTE': 'باغيت',
    'TOAST': 'توست',

    // Ingredients
    'ZIN': 'زنجر',
    'CHICKEN': 'دجاج',
    'BEEF': 'لحم',
    'CHEESE': 'جبنة',

    // Vegetables
    'PICK': 'مخلل',
    'LETTUCE': 'خس',
    'TOMATO': 'طماطم',
    'ONION': 'بصل',

    // Sauces
    'KET': 'كاتشب',
    'MAYO': 'مايونيز',
    'GARLIC': 'ثوم',
    'HOT': 'حار',
};

/**
 * Generate Arabic name based on SKU prefix
 * 
 * Rules:
 * - BRD-* → خبز + Type
 * - ING-* → مكون + Name
 * - VEG-* → خضار + Name
 * - SAUCE-* → صوص + Name
 * 
 * @param sku - Product SKU (e.g., "BRD-SHRAK", "VEG-PICK")
 * @param englishName - Fallback English name
 * @returns Arabic display name
 */
export function generateArabicName(sku: string, englishName: string): string {
    if (!sku) return englishName;

    const upper = sku.toUpperCase();

    // Extract suffix (everything after first hyphen)
    const parts = sku.split('-');
    const suffix = parts.length > 1 ? parts.slice(1).join('-') : '';

    // Transliterate suffix if we have a mapping, otherwise use as-is
    const arabicSuffix = transliterateSuffix(suffix);

    // Apply prefix rules
    if (upper.startsWith('BRD-')) {
        return `خبز ${arabicSuffix}`;
    }

    if (upper.startsWith('ING-')) {
        return `مكون ${arabicSuffix}`;
    }

    if (upper.startsWith('VEG-')) {
        return `خضار ${arabicSuffix}`;
    }

    if (upper.startsWith('SAUCE-')) {
        return `صوص ${arabicSuffix}`;
    }

    // No prefix match - return English name as fallback
    return englishName;
}

/**
 * Transliterate SKU suffix to Arabic
 * Uses SUFFIX_MAP for known terms, otherwise returns the suffix as-is
 */
function transliterateSuffix(suffix: string): string {
    if (!suffix) return '';

    const upper = suffix.toUpperCase();

    // Check if we have a direct mapping
    if (SUFFIX_MAP[upper]) {
        return SUFFIX_MAP[upper];
    }

    // Check for partial matches (e.g., "SHRAK-LARGE" → "شراك-LARGE")
    for (const [key, value] of Object.entries(SUFFIX_MAP)) {
        if (upper.includes(key)) {
            return upper.replace(key, value);
        }
    }

    // No mapping found - return original suffix
    return suffix;
}

/**
 * Arabic unit names mapping
 */
export const ARABIC_UNITS: Record<string, string> = {
    'kg': 'كيلو',
    'g': 'جرام',
    'piece': 'حبة',
    'liter': 'لتر',
    'ml': 'مل',
    'UNIT': 'حبة',
    'KG': 'كيلو',
    'G': 'جرام',
    'L': 'لتر',
};

/**
 * Get Arabic unit name
 */
export function getArabicUnit(unit: string): string {
    return ARABIC_UNITS[unit] || unit;
}
