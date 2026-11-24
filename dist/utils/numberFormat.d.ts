/** Scambia i separatori di un numero scritto all'americana: "1,234.56" diventa "1.234,56". */
export declare function italianNumber(text: string): string;
/**
 * Formattatore di Superset (d3) con il risultato in formato italiano. Vale per ogni formato,
 * anche scritto a mano: ",.2f" dà 1.234,56, ".2%" dà 12,34%, "~s" dà 1,2k.
 */
export declare function numberFormatter(format?: string): (value: number) => string;
/**
 * Numero senza formato scelto (tooltip, soglia, taglio dell'asse): migliaia sempre separate
 * (anche le quattro cifre, che l'italiano da solo non raggruppa) e al massimo `maxDecimals` decimali.
 * Con `minDecimals` i decimali sono sempre quelli (50 con un decimale: "50,0").
 * Le migliaia le mette questa funzione e non Intl, così il risultato è lo stesso in ogni browser.
 */
export declare function formatNumber(value: number, maxDecimals?: number, minDecimals?: number): string;
/** Numero breve per gli assi: 950, 1,2k, 3,4M. Un decimale solo se serve. */
export declare function formatCompact(value: number): string;
/** Percentuale da un rapporto: 0.1234 diventa "12,3%". */
export declare function formatPercent(ratio: number, digits?: number): string;
//# sourceMappingURL=numberFormat.d.ts.map