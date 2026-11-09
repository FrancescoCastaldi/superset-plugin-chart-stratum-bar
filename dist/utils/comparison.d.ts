import { TimeComparisonMode } from '../types';
/** Lingua dei testi del chart: quella scelta nel Calendar Filter, italiano di default */
export type ChartLocale = 'it' | 'en';
/** Shift automatici proposti dal pannello di controllo (sintassi Superset) */
export type ComparisonShift = '1 year ago' | '1 month ago' | '28 days ago' | string;
export declare const DEFAULT_COMPARISON_SHIFT: ComparisonShift;
/**
 * Modalità effettiva di confronto. Un valore sconosciuto o assente vale `none`, così un chart
 * salvato senza confronto non ne attiva uno.
 */
export declare function resolveComparisonMode(value?: unknown): TimeComparisonMode;
/** Testi fissi del chart nelle due lingue */
export declare function comparisonTexts(locale: ChartLocale): {
    current: string;
    previousYear: string;
    previousMonth: string;
    daysEarlier: string;
    comparison: string;
    deltaLabel: string;
    newBaseline: string;
    noFilterComparison: string;
    noRangeForShift: string;
    noComparisonData: string;
    empty: string;
};
/** Nome leggibile dello shift, nella lingua del chart */
export declare function shiftName(shift: ComparisonShift, locale: ChartLocale): string;
/** Intervallo chiuso `YYYY-MM-DD : YYYY-MM-DD` (fine esclusa, come in Superset) */
export interface DateRange {
    start: Date;
    end: Date;
}
export declare function parseRange(range: unknown): DateRange | undefined;
/** Sposta un intervallo indietro di uno shift: `1 year ago`, `1 month ago`, `N days ago`, `N weeks ago` */
export declare function shiftDate(date: Date, shift: ComparisonShift): Date | undefined;
/** True when the shift text can be read, e.g. `1 year ago` or `28 days ago` */
export declare function isValidShift(shift: ComparisonShift): boolean;
/** Intervallo spostato dallo shift, o `undefined` se lo shift non è riconosciuto */
export declare function shiftRange(range: DateRange, shift: ComparisonShift): DateRange | undefined;
export declare function rangeToString(range: DateRange): string;
/** Date leggibili, con l'ultimo giorno incluso: `01/10/2025 al 31/10/2025` (it) o `2025-10-01 to 2025-10-31` (en) */
export declare function formatRange(range: DateRange, locale: ChartLocale): string;
/**
 * Intervallo chiuso del periodo T1 (quello del filtro nativo). Superset lo richiede per ogni
 * confronto con offset: senza di esso il backend risponde con un errore.
 */
export declare function getQueryTimeRange(fd: {
    time_range?: unknown;
    extra_form_data?: any;
}): DateRange | undefined;
//# sourceMappingURL=comparison.d.ts.map