export function ensureIsArray<T>(val: T | T[] | null | undefined): T[] {
  if (val === null || val === undefined) return [];
  return Array.isArray(val) ? val : [val];
}

export function t(str: string): string {
  return str;
}

export function getNumberFormatter(formatterString?: string) {
  return (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return '';
    const num = Number(value);
    if (isNaN(num)) return String(value);
    if (formatterString === 'DURATION_COL' || formatterString === 'DURATION') {
      const totalSec = Math.floor(num / 1000);
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
    }
    if (formatterString === ',.1f') return num.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    if (formatterString === ',.2f') return num.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (formatterString === ',.0f') return num.toLocaleString('it-IT', { maximumFractionDigits: 0 });
    if (formatterString === '.1%') return `${(num * 100).toFixed(1)}%`;
    if (formatterString === '.2%') return `${(num * 100).toFixed(2)}%`;
    if (formatterString === '$,.2f') return `€ ${num.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return num.toLocaleString('it-IT');
  };
}

export function getTimeFormatter(format?: string) {
  return (val: any) => String(val ?? '');
}

const PALETTES: Record<string, string[]> = {
  executive: ['#0284c7', '#0d9488', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#f97316'],
  healthcare: ['#0284c7', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899'],
  slateDark: ['#38bdf8', '#34d399', '#a78bfa', '#fbbf24', '#f472b6', '#22d3ee'],
  supersetColors: [
    '#3b82f6', '#10b981', '#f59e0b', '#ec4899',
    '#8b5cf6', '#06b6d4', '#f97316', '#6366f1'
  ],
};

export const CategoricalColorNamespace = {
  getScale: (scheme?: string) => {
    const key = scheme && PALETTES[scheme] ? scheme : 'supersetColors';
    const colors = PALETTES[key] || PALETTES.supersetColors;
    return {
      getColor: (_strKey: string, idx = 0) => colors[idx % colors.length],
      colors,
    };
  },
};

export class ChartMetadata {
  constructor(public config: any = {}) {}
}

export class ChartPlugin {
  constructor(public config: any = {}) {}
}

export const Behavior = {
  INTERACTIVE_CHART: 'INTERACTIVE_CHART',
  DRILL_TO_DETAIL: 'DRILL_TO_DETAIL',
  DRILL_BY: 'DRILL_BY',
};

export type DataRecord = Record<string, any>;
export type QueryContext = any;
export type ChartProps = any;
export type QueryFormData = Record<string, any>;

export function buildQueryContext() {
  return {};
}
