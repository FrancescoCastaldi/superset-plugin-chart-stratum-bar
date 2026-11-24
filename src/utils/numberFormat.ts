import { getNumberFormatter } from '@superset-ui/core';

/**
 * Numeri del grafico in formato italiano: punto per le migliaia, virgola per i decimali
 * (1.234,56 e 7,03). Tutto ciò che il grafico scrive passa da qui, così etichette, assi, tooltip
 * e soglia dicono lo stesso numero nello stesso modo.
 */

const DEFAULT_FORMAT = ',.0f';

/** Scambia i separatori di un numero scritto all'americana: "1,234.56" diventa "1.234,56". */
export function italianNumber(text: string): string {
  return text.replace(/[.,]/g, separator => (separator === ',' ? '.' : ','));
}

const formatters = new Map<string, (value: number) => string>();

/**
 * Formattatore di Superset (d3) con il risultato in formato italiano. Vale per ogni formato,
 * anche scritto a mano: ",.2f" dà 1.234,56, ".2%" dà 12,34%, "~s" dà 1,2k.
 */
export function numberFormatter(format?: string): (value: number) => string {
  const key = format || DEFAULT_FORMAT;
  let formatter = formatters.get(key);
  if (!formatter) {
    try {
      const base = getNumberFormatter(key);
      formatter = (value: number) => italianNumber(base(value));
    } catch {
      // A format typed by hand that d3 does not know: the number is still shown
      formatter = (value: number) => formatNumber(value);
    }
    formatters.set(key, formatter);
  }
  return formatter;
}

const decimalFormats = new Map<string, Intl.NumberFormat>();

/** Punto ogni tre cifre della parte intera: "1234567" diventa "1.234.567". */
const groupThousands = (digits: string): string => digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/**
 * Numero senza formato scelto (tooltip, soglia, taglio dell'asse): migliaia sempre separate
 * (anche le quattro cifre, che l'italiano da solo non raggruppa) e al massimo `maxDecimals` decimali.
 * Con `minDecimals` i decimali sono sempre quelli (50 con un decimale: "50,0").
 * Le migliaia le mette questa funzione e non Intl, così il risultato è lo stesso in ogni browser.
 */
export function formatNumber(value: number, maxDecimals = 2, minDecimals = 0): string {
  const key = `${minDecimals}-${maxDecimals}`;
  let format = decimalFormats.get(key);
  if (!format) {
    format = new Intl.NumberFormat('it-IT', {
      useGrouping: false,
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals,
    });
    decimalFormats.set(key, format);
  }
  return format.format(value).replace(/^(-?)(\d+)/, (_whole, sign: string, digits: string) => sign + groupThousands(digits));
}

/** Numero breve per gli assi: 950, 1,2k, 3,4M. Un decimale solo se serve. */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${formatNumber(value / 1_000_000, 1)}M`;
  if (abs >= 1_000) return `${formatNumber(value / 1_000, 1)}k`;
  return formatNumber(value, 2);
}

/** Percentuale da un rapporto: 0.1234 diventa "12,3%". */
export function formatPercent(ratio: number, digits = 1): string {
  return `${formatNumber(ratio * 100, digits)}%`;
}
