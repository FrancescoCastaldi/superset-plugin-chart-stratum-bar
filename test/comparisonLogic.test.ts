import {
  formatRange,
  getQueryTimeRange,
  parseRange,
  shiftDate,
  shiftRange,
} from '../src/utils/comparison';
import { buildSeriesRepresentation } from '../src/plugin/seriesBuilder';
import { getTooltipFormatter } from '../src/utils/echartsUtils';
import transformProps from '../src/plugin/transformProps';
import buildQuery from '../src/plugin/buildQuery';
import { ChartProps } from '@superset-ui/core';

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));
const iso = (d: Date | undefined) => (d ? d.toISOString().slice(0, 10) : undefined);

describe('date math: shifts across month ends and leap years', () => {
  it('moves back one month from the 29th of February without leaving the month', () => {
    expect(iso(shiftDate(utc(2024, 2, 29), '1 month ago'))).toBe('2024-01-29');
  });

  it('clamps three months back from 31 May to the last day of a leap February', () => {
    expect(iso(shiftDate(utc(2024, 5, 31), '3 months ago'))).toBe('2024-02-29');
  });

  it('clamps three months back from 31 May to the last day of a common February', () => {
    expect(iso(shiftDate(utc(2025, 5, 31), '3 months ago'))).toBe('2025-02-28');
  });

  it('moves a leap day back one year to 28 February of a common year', () => {
    expect(iso(shiftDate(utc(2028, 2, 29), '1 year ago'))).toBe('2027-02-28');
  });

  it('keeps the leap day when the shift lands on another leap year', () => {
    expect(iso(shiftDate(utc(2028, 2, 29), '4 years ago'))).toBe('2024-02-29');
  });

  it('shifts a range that crosses February of a leap year with its end still excluded', () => {
    const shifted = shiftRange(parseRange('2024-02-29 : 2024-03-01')!, '1 year ago');
    expect(shifted && `${iso(shifted.start)} : ${iso(shifted.end)}`).toBe('2023-02-28 : 2023-03-01');
  });

  it('shifts a whole month without changing its length', () => {
    const shifted = shiftRange(parseRange('2026-03-01 : 2026-04-01')!, '1 month ago');
    expect(shifted && `${iso(shifted.start)} : ${iso(shifted.end)}`).toBe('2026-02-01 : 2026-03-01');
  });

  it('accepts units in any case and surrounding spaces, and rejects text it cannot read', () => {
    expect(iso(shiftDate(utc(2026, 11, 9), ' 28 Days AGO '))).toBe('2026-10-12');
    expect(iso(shiftDate(utc(2026, 11, 9), '0 days ago'))).toBe('2026-11-09');
    expect(shiftDate(utc(2026, 11, 9), '-1 year ago')).toBeUndefined();
    expect(shiftDate(utc(2026, 11, 9), 'a year ago')).toBeUndefined();
    expect(shiftDate(utc(2026, 11, 9), '1 fortnight ago')).toBeUndefined();
  });
});

describe('ranges: parsing and labels', () => {
  it('rejects a date that does not exist instead of rolling it over to March', () => {
    expect(parseRange('2026-02-30 : 2026-03-01')).toBeUndefined();
    expect(parseRange('2025-02-29 : 2025-03-01')).toBeUndefined();
  });

  it('accepts a leap day that really exists', () => {
    expect(parseRange('2024-02-29 : 2024-03-01')).toBeDefined();
  });

  it('rejects an impossible date even when the rollover would keep the range ordered', () => {
    expect(parseRange('2026-02-30 : 2026-04-01')).toBeUndefined();
    expect(parseRange('2026-04-31 : 2026-05-02')).toBeUndefined();
  });

  it('rejects malformed text and a range that ends on its own start', () => {
    expect(parseRange('2026-1-1 : 2026-02-01')).toBeUndefined();
    expect(parseRange('2026-10-01')).toBeUndefined();
    expect(parseRange('2026-10-01 : 2026-10-01')).toBeUndefined();
  });

  it('shows the last day included, also across a year boundary', () => {
    const range = parseRange('2025-12-01 : 2026-01-01')!;
    expect(formatRange(range, 'en')).toBe('2025-12-01 to 2025-12-31');
    expect(formatRange(range, 'it')).toBe('01/12/2025 al 31/12/2025');
  });

  it('shows a one-day range as a single date', () => {
    expect(formatRange(parseRange('2026-10-01 : 2026-10-02')!, 'it')).toBe('01/10/2026 al 01/10/2026');
  });

  it('prefers the time range of the dashboard over a temporal filter, and skips an invalid one', () => {
    expect(
      getQueryTimeRange({
        extra_form_data: {
          time_range: '2026-01-01 : 2026-02-01',
          filters: [{ op: 'TEMPORAL_RANGE', val: '2025-01-01 : 2025-02-01' }],
        },
      }),
    ).toEqual({ start: utc(2026, 1, 1), end: utc(2026, 2, 1) });

    expect(
      iso(
        getQueryTimeRange({
          extra_form_data: {
            time_range: 'No filter',
            filters: [{ op: 'TEMPORAL_RANGE', val: '2025-01-01 : 2025-02-01' }],
          },
        })?.start,
      ),
    ).toBe('2025-01-01');
  });
});

describe('buildQuery: offsets only when they can be computed', () => {
  const base = (mode: string, extra: Record<string, unknown> = {}) => ({
    viz_type: 'stratum_bar',
    datasource: '70__table',
    x_axis: 'CANALE',
    metrics: ['richieste'],
    time_comparison_mode: mode,
    extra_form_data: { time_range: '2026-09-01 : 2026-10-01' },
    ...extra,
  });
  const firstQuery = (fd: any) => {
    const ctx: any = buildQuery(fd);
    return ctx.queries ? ctx.queries[0] : ctx[0];
  };

  it('does not send an unreadable shift to the server', () => {
    const q = firstQuery(base('time_shift', { comparison_shift: 'fortnight ago' }));
    expect(q.time_offsets).toBeUndefined();
  });

  it('sends no offsets in time_offsets mode when the filter has no second period', () => {
    expect(firstQuery(base('time_offsets')).time_offsets).toBeUndefined();
  });

  it('sends the offsets of the shift only, never the dashboard time_compare, in time_shift mode', () => {
    const q = firstQuery(
      base('time_shift', { comparison_shift: '1 year ago', extra_form_data: { time_range: '2026-09-01 : 2026-10-01', time_compare: ['2020-01-01 : 2020-02-01'] } }),
    );
    expect(q.time_offsets).toEqual(['1 year ago']);
  });
});

describe('dual series: delta arithmetic', () => {
  const build = (rows: any[], extra: Partial<Parameters<typeof buildSeriesRepresentation>[0]> = {}) =>
    buildSeriesRepresentation({
      data: rows,
      isPivoted: false,
      actualXKey: 'REP',
      actualMetricKey: 't1',
      primaryMetric: 't1',
      metricList: ['t1'],
      secondaryMetricList: [],
      y_axis_2_format: ',.2f',
      getColor: () => undefined,
      palette: ['#1c3d5e', '#7aa8cf'],
      formatter: (v: number) => String(v),
      resolvedXAxis: 'REP',
      secFormatter: (v: number) => String(v),
      secondary_line_color: '#ea580c',
      secondary_series_type: 'line',
      secPalette: [],
      combineFlag: false,
      sampleRow: rows[0] ?? {},
      potentialPivotedKeys: [],
      timeComparisonMode: 'time_shift',
      comparisonMetric: 't2',
      time1Label: 'T1',
      time2Label: 'T2',
      ...extra,
    });

  it('computes the percentage against the absolute value of a negative comparison', () => {
    const res = build([{ REP: 'A', t1: 50, t2: -100 }]);
    expect(res.series[0].items[0].deltaPercent).toBe(150);
    expect(res.series[0].items[0].delta).toBe(150);
  });

  it('gives the comparison series the opposite sign of the delta', () => {
    const res = build([{ REP: 'A', t1: 120, t2: 100 }]);
    expect(res.series[0].items[0].deltaPercent).toBe(20);
    expect(res.series[1].items[0].deltaPercent).toBe(-20);
    expect(res.series[1].items[0].delta).toBe(-20);
  });

  it('marks a new baseline when the comparison is zero and the current value is positive', () => {
    const res = build([{ REP: 'A', t1: 30, t2: 0 }]);
    expect(res.series[0].items[0].isNewBaseline).toBe(true);
    expect(res.series[0].items[0].deltaPercent).toBeNull();
  });

  it('shows no change when both values are zero, not a new baseline', () => {
    const res = build([{ REP: 'A', t1: 0, t2: 0 }]);
    expect(res.series[0].items[0].isNewBaseline).toBe(false);
    expect(res.series[0].items[0].deltaPercent).toBe(0);
  });

  it('computes no delta when one of the two values is missing', () => {
    const res = build([{ REP: 'A', t1: null, t2: 80 }, { REP: 'B', t1: 80, t2: null }]);
    expect(res.series[0].items[0].delta).toBeNull();
    expect(res.series[0].items[1].deltaPercent).toBeNull();
    expect(res.series[1].items[0].value).toBe(80);
  });

  it('matches rows by category even when the comparison is in a different row order', () => {
    const res = build([{ REP: 'B', t1: 10, t2: 5 }, { REP: 'A', t1: 40, t2: 20 }]);
    expect(res.categories).toEqual(['B', 'A']);
    expect(res.series[0].data).toEqual([10, 40]);
    expect(res.series[1].data).toEqual([5, 20]);
  });

  it('pairs T1 and T2 by category and series when the categories are combined, leaving gaps empty', () => {
    const rows = [
      { REP: 'CA', REG: 'Privato', t1: 10, t2: 8 },
      { REP: 'CA', REG: 'Pubblico', t1: 4, t2: 6 },
      { REP: 'NY', REG: 'Privato', t1: 7, t2: 7 },
    ];
    const res = build(rows, { combineFlag: true, actualBreakdownKey: 'REG', sampleRow: rows[0] });
    expect(res.categories).toEqual(['CA · Privato', 'CA · Pubblico', 'NY · Privato']);
    expect(res.series[0].data).toEqual([10, 4, 7]);
    expect(res.series[1].data).toEqual([8, 6, 7]);
  });

  it('keeps the first row when the same category and series appear twice', () => {
    const rows = [
      { REP: 'CA', REG: 'Privato', t1: 10, t2: 8 },
      { REP: 'CA', REG: 'Privato', t1: 99, t2: 99 },
    ];
    const res = build(rows, { combineFlag: true, actualBreakdownKey: 'REG', sampleRow: rows[0] });
    expect(res.series[0].data).toEqual([10]);
  });
});

describe('delta badge: rendering rules', () => {
  const comparison = (polarity: 'normal' | 'inverted' = 'normal') => ({
    mode: 'time_shift' as const,
    active: true,
    t1Name: 'Corrente',
    t2Name: 'Precedente',
    showDelta: true,
    polarity,
    locale: 'it' as const,
  });
  const fmt = (items: any[], cmp: any = comparison()) =>
    getTooltipFormatter(['CA'], false, ['#1c3d5e'], false, undefined, undefined, undefined, undefined, false, true, cmp)(items);
  const pair = (v1: any, v2: any) => [
    { seriesName: 'Corrente', value: v1, seriesIndex: 0, color: '#1c3d5e', data: v1 },
    { seriesName: 'Precedente', value: v2, seriesIndex: 1, color: '#7aa8cf', data: v2 },
  ];

  it('shows "Nuovo" when the comparison is zero and the current value is positive', () => {
    expect(fmt(pair(30, 0))).toContain('Nuovo');
  });

  it('rounds the percentage to one decimal and keeps the sign of a rise', () => {
    const html = fmt(pair(100, 75));
    expect(html).toContain('+33.3%');
    expect(html).toContain('(+25)');
  });

  it('writes a fall with a minus sign and no plus', () => {
    const html = fmt(pair(50, 100));
    expect(html).toContain('-50.0%');
    expect(html).toContain('(-50)');
    expect(html).not.toContain('+-');
  });

  it('shows no badge when one of the two values is missing', () => {
    expect(fmt(pair(null, 100))).not.toContain('Scostamento');
    expect(fmt(pair(40, null))).not.toContain('Scostamento');
  });

  it('colors a rise red and a fall green when the polarity is inverted', () => {
    expect(fmt(pair(120, 100), comparison('inverted'))).toContain('#D32F2F');
    expect(fmt(pair(80, 100), comparison('inverted'))).toContain('#2E7D32');
  });

  it('hides the badge when the user turned the delta off', () => {
    expect(fmt(pair(120, 100), { ...comparison(), showDelta: false })).not.toContain('Scostamento');
  });
});

describe('transformProps: notices and names of the second period', () => {
  const run = (formData: Record<string, unknown>, rows: any[]) =>
    transformProps({
      width: 800,
      height: 500,
      formData: { viz_type: 'stratum_bar', datasource: '1__table', x_axis: 'state', metrics: ['sum__num'], ...formData },
      queriesData: [{ data: rows }],
    } as unknown as ChartProps);

  const rows = [
    { state: 'CA', sum__num: 110, 'sum__num__2025-09-01 : 2025-10-01': 100 },
    { state: 'NY', sum__num: 40, 'sum__num__2025-09-01 : 2025-10-01': 60 },
  ];

  it('explains the missing second period when the filter has none', () => {
    const props = run({ time_comparison_mode: 'time_offsets', extra_form_data: { time_range: '2026-09-01 : 2026-10-01' } }, [{ state: 'CA', sum__num: 110 }]);
    expect(props.comparison?.active).toBe(false);
    expect(props.comparison?.notice).toContain('Calendar Filter');
  });

  it('names the second period with its readable range when the filter gave no name', () => {
    const props = run(
      { time_comparison_mode: 'time_offsets', extra_form_data: { time_range: '2026-09-01 : 2026-10-01', time_compare: ['2025-09-01 : 2025-10-01'] } },
      rows,
    );
    expect(props.comparison?.active).toBe(true);
    expect(props.series[1].name).toBe('Periodo di confronto · 01/09/2025 al 30/09/2025');
  });

  it('marks the second period as having no data when every value of it is missing', () => {
    const empty = rows.map(r => ({ ...r, 'sum__num__2025-09-01 : 2025-10-01': null }));
    const props = run(
      { time_comparison_mode: 'time_offsets', extra_form_data: { time_range: '2026-09-01 : 2026-10-01', time_compare: ['2025-09-01 : 2025-10-01'] } },
      empty,
    );
    expect(props.series[1].name).toContain('nessun dato');
  });

  it('uses the metric of the second period given as an object, by its label', () => {
    const props = run(
      { time_comparison_mode: 'dual_metric', comparison_metric: { label: 'Richieste 2025', metric_name: 'x' } },
      [{ state: 'CA', sum__num: 110, 'Richieste 2025': 100 }],
    );
    expect(props.series).toHaveLength(2);
    expect(props.series[1].data).toEqual([100]);
  });

  it('keeps the chart readable with the comparison on but no value returned for the period', () => {
    const props = run({ time_comparison_mode: 'time_shift', comparison_shift: '1 year ago', extra_form_data: { time_range: '2026-09-01 : 2026-10-01' } }, [{ state: 'CA', sum__num: 110 }]);
    expect(props.series.length).toBe(1);
    expect(props.comparison?.notice).toBeDefined();
  });
});
