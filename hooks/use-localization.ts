import { useLocale } from 'next-intl';
import { getArabicUnit } from '@/lib/utils/arabic-translation';

/**
 * Hook to get localized product name
 * Returns Arabic name when locale is 'ar', otherwise English name
 */
export function useProductName(product: { name: string; arabicName?: string | null }) {
    const locale = useLocale();

    if (locale === 'ar' && product.arabicName) {
        return product.arabicName;
    }

    return product.name;
}

/**
 * Hook to get localized unit name
 * Returns Arabic unit when locale is 'ar', otherwise English unit
 */
export function useUnitName(unit: string) {
    const locale = useLocale();

    if (locale === 'ar') {
        return getArabicUnit(unit);
    }

    return unit;
}

/**
 * Utility to get product display name (can be used in server components)
 */
export function getProductDisplayName(
    product: { name: string; arabicName?: string | null },
    locale: string
): string {
    if (locale === 'ar' && product.arabicName) {
        return product.arabicName;
    }
    return product.name;
}
