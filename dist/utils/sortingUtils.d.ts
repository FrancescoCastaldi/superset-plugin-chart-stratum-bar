/**
 * sortingUtils.ts — Natural & Chronological Category Sorting Engine
 * Handles time slots (e.g. 8–13, 13–18, 18–22, 22–8), days of the week,
 * month names, numbered categories (1 - Lunedì), and natural numeric collation.
 */
export declare const KNOWN_TIME_SLOTS: Record<string, number>;
export declare const KNOWN_DAYS: Record<string, number>;
export declare const KNOWN_MONTHS: Record<string, number>;
/**
 * Extracts a chronological sort rank for a category label.
 * Returns null if no custom chronological ranking applies.
 */
export declare function getCategoryRank(category: string): number | null;
/**
 * Sorts category dimension values chronologically, naturally, or alphabetically.
 * Preserves exact mapping between categories and series data points.
 */
export declare function sortCategories(categories: string[], orderDesc?: boolean): string[];
//# sourceMappingURL=sortingUtils.d.ts.map