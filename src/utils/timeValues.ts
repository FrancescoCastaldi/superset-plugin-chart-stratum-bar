import { DataRecord } from '@superset-ui/core';

/**
 * Time and duration values.
 *
 * A metric of type Time (SQL Server `time`, a duration, an average waiting time) reaches the chart as a
 * string such as "00:12:54.425000". The chart works on seconds: the columns that hold times are converted
 * to numbers once, in transformProps, and everything after (axis, bars, labels, tooltip, benchmark) formats
 * the seconds back as a duration.
 */

export type TimeDetection = 'auto' | 'off';
export type TimeDisplayFormat = 'auto' | 'hms' | 'ms' | 'minutes' | 'hours' | 'seconds';
export type ValueKind = 'number' | 'time';

export interface TimeFormatOptions {
  format?: TimeDisplayFormat;
  /** Decimals of the seconds in clock formats and of the value in decimal formats */
  fractionDigits?: number;
  /** Largest value of the chart in seconds, used by the automatic format to choose h:mm:ss or mm:ss */
  referenceSeconds?: number;
}

const CLOCK_RE =
  /^(-)?(?:(\d+)\s*(?:days?|d)\s*,?\s*)?(\d{1,4}):([0-5]\d):([0-5]\d)(?:[.,](\d{1,9}))?\s*(?:Z|[+-]\d{2}(?::?\d{2})?)?$/i;
const ISO_DURATION_RE = /^(-)?P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:[.,]\d+)?)S)?)?$/i;

/**
 * Seconds of a time or duration written as text, or null when the text is not one.
 * Accepted: `HH:MM:SS`, `H:MM:SS.ffffff`, `26:10:00` (more than 24 hours), `1 day, 2:03:04`,
 * `0 days 00:12:54.425000` and ISO 8601 durations (`PT12M54S`). Two-part values such as `12:54` are not
 * accepted: they could be hours and minutes or minutes and seconds.
 */
export function parseTimeToSeconds(raw: unknown): number | null {
  if (typeof raw !== 'string') return null;
  const text = raw.trim();
  if (!text) return null;

  const clock = CLOCK_RE.exec(text);
  if (clock) {
    const [, minus, days, hours, minutes, seconds, fraction] = clock;
    const total =
      Number(days || 0) * 86400 +
      Number(hours) * 3600 +
      Number(minutes) * 60 +
      Number(seconds) +
      (fraction ? Number(`0.${fraction}`) : 0);
    return minus ? -total : total;
  }

  const iso = ISO_DURATION_RE.exec(text);
  if (iso && /[0-9]/.test(text)) {
    const [, minus, days, hours, minutes, seconds] = iso;
    const total =
      Number(days || 0) * 86400 +
      Number(hours || 0) * 3600 +
      Number(minutes || 0) * 60 +
      Number((seconds || '0').replace(',', '.'));
    return minus ? -total : total;
  }

  return null;
}

/** True when every non-empty value of the column is a time and there is at least one */
export function isTimeColumn(rows: DataRecord[], key: string): boolean {
  let seen = 0;
  for (const row of rows) {
    const value = row[key];
    if (value === null || value === undefined || value === '') continue;
    if (parseTimeToSeconds(value) === null) return false;
    seen += 1;
  }
  return seen > 0;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

function clock(totalSeconds: number, withHours: boolean, digits: number): string {
  const sign = totalSeconds < 0 ? '-' : '';
  const factor = 10 ** digits;
  const rounded = Math.round(Math.abs(totalSeconds) * factor) / factor;
  const whole = Math.floor(rounded);
  const fraction = digits > 0 ? `.${String(Math.round((rounded - whole) * factor)).padStart(digits, '0')}` : '';
  const seconds = whole % 60;
  const minutesTotal = Math.floor(whole / 60);
  if (withHours) {
    return `${sign}${Math.floor(minutesTotal / 60)}:${pad2(minutesTotal % 60)}:${pad2(seconds)}${fraction}`;
  }
  return `${sign}${pad2(minutesTotal)}:${pad2(seconds)}${fraction}`;
}

function decimal(value: number, digits: number, unit: string): string {
  return `${Number(value.toFixed(digits)).toLocaleString('it-IT', { maximumFractionDigits: digits })} ${unit}`;
}

/** Text of a number of seconds in the chosen display format */
export function formatDuration(seconds: number, options: TimeFormatOptions = {}): string {
  if (typeof seconds !== 'number' || !isFinite(seconds)) return '';
  const { format = 'auto', fractionDigits = 0, referenceSeconds } = options;
  const digits = Math.min(3, Math.max(0, Math.round(fractionDigits)));
  switch (format) {
    case 'hms':
      return clock(seconds, true, digits);
    case 'ms':
      return clock(seconds, false, digits);
    case 'minutes':
      return decimal(seconds / 60, digits, 'min');
    case 'hours':
      return decimal(seconds / 3600, digits, 'h');
    case 'seconds':
      return decimal(seconds, digits, 's');
    default: {
      // Automatic: hours appear only when the chart has values of an hour or more
      // The choice is made on the rounded value: 3599.6 s is written 1:00:00, not 60:00
      const factor = 10 ** digits;
      const reference = Math.round(Math.max(Math.abs(seconds), referenceSeconds || 0) * factor) / factor;
      return clock(seconds, reference >= 3600, digits);
    }
  }
}

/** Spacing candidates for the ticks of a time axis, in seconds */
const TICK_STEPS = [
  1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 10800, 21600, 43200, 86400, 172800, 604800,
];

/** A round spacing (seconds, minutes, hours) that gives about `targetTicks` ticks up to `max` */
export function niceTimeInterval(max: number, targetTicks = 5): number | undefined {
  if (!(max > 0)) return undefined;
  const raw = max / targetTicks;
  return TICK_STEPS.find(step => step >= raw) ?? TICK_STEPS[TICK_STEPS.length - 1];
}

/** Whether the bars (or lines) of an axis are all Time fields, and so the axis shows durations */
export function axisTimeOptions(
  series: { yAxisIndex?: number; valueKind?: ValueKind; seriesType?: string }[],
  secondary: boolean,
  timeFormat?: TimeFormatOptions,
): TimeFormatOptions | undefined {
  if (!timeFormat) return undefined;
  const onAxis = series.filter(s => (s.yAxisIndex === 1) === secondary && (secondary || s.seriesType !== 'line'));
  return onAxis.length > 0 && onAxis.every(s => s.valueKind === 'time') ? timeFormat : undefined;
}

/** Largest value of the series on one axis, in seconds */
export function axisDataMax(series: { yAxisIndex?: number; data: (number | null)[] }[], secondary: boolean): number {
  let max = 0;
  series.forEach(s => {
    if ((s.yAxisIndex === 1) !== secondary) return;
    s.data.forEach(v => {
      if (typeof v === 'number' && isFinite(v) && v > max) max = v;
    });
  });
  return max;
}

/** What the tooltip needs to write Time series as durations (undefined when the chart has none) */
export function tooltipTimeInfo(
  series: { name: string; valueKind?: ValueKind }[],
  timeFormat?: TimeFormatOptions,
): { options: TimeFormatOptions; seriesNames: string[] } | undefined {
  if (!timeFormat) return undefined;
  const seriesNames = series.filter(s => s.valueKind === 'time').map(s => s.name);
  return seriesNames.length > 0 ? { options: timeFormat, seriesNames } : undefined;
}

/** Tick spacing, top and labels of a value axis that shows durations */
export function timeAxisSettings(timeFormat: TimeFormatOptions, max?: number) {
  const reference = max && max > 0 ? max : timeFormat.referenceSeconds || 0;
  const interval = niceTimeInterval(reference);
  // Ticks sit on round times; in decimal formats two digits keep ticks such as 0,25 h apart
  const isDecimal = ['minutes', 'hours', 'seconds'].includes(timeFormat.format || '');
  const labelOptions: TimeFormatOptions = {
    ...timeFormat,
    fractionDigits: isDecimal ? Math.max(timeFormat.fractionDigits || 0, 2) : 0,
  };
  return {
    interval,
    max: interval && max && max > 0 ? Math.ceil(max / interval) * interval : undefined,
    formatter: (value: number) => formatDuration(value, labelOptions),
  };
}

/** Rows with the time columns among `candidates` converted to seconds, and the names of those columns */
export function convertTimeColumns(
  rows: DataRecord[],
  candidates: string[],
): { rows: DataRecord[]; timeKeys: string[] } {
  if (rows.length === 0 || candidates.length === 0) return { rows, timeKeys: [] };
  const present = new Set<string>();
  rows.forEach(row => Object.keys(row).forEach(k => present.add(k)));
  const wanted = new Set(candidates.map(c => c.toLowerCase()));
  const timeKeys = Array.from(present).filter(k => wanted.has(k.toLowerCase()) && isTimeColumn(rows, k));
  if (timeKeys.length === 0) return { rows, timeKeys: [] };
  const converted = rows.map(row => {
    const copy: DataRecord = { ...row };
    timeKeys.forEach(k => {
      const value = row[k];
      copy[k] = value === null || value === undefined || value === '' ? null : parseTimeToSeconds(value);
    });
    return copy;
  });
  return { rows: converted, timeKeys };
}
