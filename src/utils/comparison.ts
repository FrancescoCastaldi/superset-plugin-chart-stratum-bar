import { TimeComparisonMode } from '../types';

/** Lingua dei testi del chart: quella scelta nel Calendar Filter, italiano di default */
export type ChartLocale = 'it' | 'en';

/** Shift automatici proposti dal pannello di controllo (sintassi Superset) */
export type ComparisonShift = '1 year ago' | '1 month ago' | '28 days ago' | string;

export const DEFAULT_COMPARISON_SHIFT: ComparisonShift = '1 year ago';

const MODES: TimeComparisonMode[] = ['none', 'time_offsets', 'time_shift', 'dual_metric'];

/**
 * Modalità effettiva di confronto. Un valore sconosciuto o assente vale `none`, così un chart
 * salvato senza confronto non ne attiva uno.
 */
export function resolveComparisonMode(value?: unknown): TimeComparisonMode {
  return MODES.includes(value as TimeComparisonMode) ? (value as TimeComparisonMode) : 'none';
}

/** Testi fissi del chart nelle due lingue */
export function comparisonTexts(locale: ChartLocale) {
  const it = locale === 'it';
  return {
    current: it ? 'Periodo corrente' : 'Current period',
    previousYear: it ? 'Anno precedente' : 'Previous year',
    previousMonth: it ? 'Mese precedente' : 'Previous month',
    daysEarlier: it ? '28 giorni prima' : '28 days earlier',
    comparison: it ? 'Periodo di confronto' : 'Comparison period',
    deltaLabel: it ? 'Scostamento (T1 vs T2):' : 'Deviation (T1 vs T2):',
    newBaseline: it ? 'Nuovo' : 'New',
    noFilterComparison: it
      ? 'Nel Calendar Filter non è selezionato un periodo di confronto: il grafico mostra solo il periodo corrente.'
      : 'No comparison period is selected in the Calendar Filter: the chart shows only the current period.',
    noRangeForShift: it
      ? 'Seleziona un periodo continuo nel Calendar Filter per vedere il confronto automatico.'
      : 'Select a continuous period in the Calendar Filter to see the automatic comparison.',
    noComparisonData: it ? 'nessun dato' : 'no data',
    empty: it ? 'Nessun dato da mostrare nel grafico Stratum Bar.' : 'No data to show in the StratumBar chart.',
  };
}

/** Nome leggibile dello shift, nella lingua del chart */
export function shiftName(shift: ComparisonShift, locale: ChartLocale): string {
  const t = comparisonTexts(locale);
  switch (shift) {
    case '1 year ago':
      return t.previousYear;
    case '1 month ago':
      return t.previousMonth;
    case '28 days ago':
      return t.daysEarlier;
    default:
      return `${t.comparison} (${shift})`;
  }
}

/** Intervallo chiuso `YYYY-MM-DD : YYYY-MM-DD` (fine esclusa, come in Superset) */
export interface DateRange {
  start: Date;
  end: Date;
}

const RANGE_RE = /^\s*(\d{4}-\d{2}-\d{2})\s*:\s*(\d{4}-\d{2}-\d{2})\s*$/;

export function parseRange(range: unknown): DateRange | undefined {
  if (typeof range !== 'string') return undefined;
  const m = RANGE_RE.exec(range);
  if (!m) return undefined;
  const start = toUtcDate(m[1]);
  const end = toUtcDate(m[2]);
  if (!start || !end || end <= start) return undefined;
  return { start, end };
}

/** A calendar date that exists: `2026-02-30` is rejected, not rolled over to March */
function toUtcDate(iso: string): Date | undefined {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(date.getTime()) || date.getUTCDate() !== d || date.getUTCMonth() !== m - 1) return undefined;
  return date;
}

function fmtIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Aggiunge mesi senza sconfinare: 31 gennaio + 1 mese = 28/29 febbraio */
function addMonths(date: Date, months: number): Date {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + months;
  const day = date.getUTCDate();
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(day, lastDay)));
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

/** Sposta un intervallo indietro di uno shift: `1 year ago`, `1 month ago`, `N days ago`, `N weeks ago` */
export function shiftDate(date: Date, shift: ComparisonShift): Date | undefined {
  const match = /^\s*(\d+)\s+(year|years|month|months|week|weeks|day|days)\s+ago\s*$/i.exec(shift);
  if (!match) return undefined;
  const n = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (unit.startsWith('year')) return addMonths(date, -12 * n);
  if (unit.startsWith('month')) return addMonths(date, -n);
  if (unit.startsWith('week')) return addDays(date, -7 * n);
  return addDays(date, -n);
}

/** True when the shift text can be read, e.g. `1 year ago` or `28 days ago` */
export function isValidShift(shift: ComparisonShift): boolean {
  return shiftDate(new Date(Date.UTC(2026, 0, 15)), shift) !== undefined;
}

/** Intervallo spostato dallo shift, o `undefined` se lo shift non è riconosciuto */
export function shiftRange(range: DateRange, shift: ComparisonShift): DateRange | undefined {
  const start = shiftDate(range.start, shift);
  const end = shiftDate(range.end, shift);
  if (!start || !end) return undefined;
  return { start, end };
}

export function rangeToString(range: DateRange): string {
  return `${fmtIso(range.start)} : ${fmtIso(range.end)}`;
}

/** Date leggibili, con l'ultimo giorno incluso: `01/10/2025 al 31/10/2025` (it) o `2025-10-01 to 2025-10-31` (en) */
export function formatRange(range: DateRange, locale: ChartLocale): string {
  const last = addDays(range.end, -1);
  if (locale === 'it') {
    const f = (d: Date) => `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
    return `${f(range.start)} al ${f(last)}`;
  }
  return `${fmtIso(range.start)} to ${fmtIso(last)}`;
}

/** Intervallo di un filtro `TEMPORAL_RANGE` o di un `time_range` testuale, se chiuso */
function rangeFromFilters(filters: unknown): string | undefined {
  if (!Array.isArray(filters)) return undefined;
  const found = filters.find(
    f => f && f.op === 'TEMPORAL_RANGE' && typeof f.val === 'string' && f.val !== 'No filter',
  );
  return found ? (found.val as string) : undefined;
}

/**
 * Intervallo chiuso del periodo T1 (quello del filtro nativo). Superset lo richiede per ogni
 * confronto con offset: senza di esso il backend risponde con un errore.
 */
export function getQueryTimeRange(fd: { time_range?: unknown; extra_form_data?: any }): DateRange | undefined {
  const candidates = [
    fd.extra_form_data?.time_range,
    fd.time_range,
    rangeFromFilters(fd.extra_form_data?.filters),
  ];
  for (const candidate of candidates) {
    const parsed = parseRange(candidate);
    if (parsed) return parsed;
  }
  return undefined;
}
