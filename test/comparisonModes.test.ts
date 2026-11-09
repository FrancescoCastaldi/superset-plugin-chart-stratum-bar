import {
  formatRange,
  getQueryTimeRange,
  parseRange,
  resolveComparisonMode,
  shiftDate,
  shiftName,
  shiftRange,
} from '../src/utils/comparison';
import { getTooltipFormatter } from '../src/utils/echartsUtils';
import transformProps from '../src/plugin/transformProps';
import { ChartProps } from '@superset-ui/core';

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

describe('comparison modes and date shifts', () => {
  it('reads only the four known modes, anything else means no comparison', () => {
    expect(resolveComparisonMode('time_shift')).toBe('time_shift');
    expect(resolveComparisonMode('time_offsets')).toBe('time_offsets');
    expect(resolveComparisonMode('dual_metric')).toBe('dual_metric');
    expect(resolveComparisonMode('none')).toBe('none');
    expect(resolveComparisonMode('something_old')).toBe('none');
    expect(resolveComparisonMode(undefined)).toBe('none');
  });

  it('shifts by a year, a month (clamped to the month end) and days', () => {
    expect(shiftDate(utc(2024, 2, 29), '1 year ago')).toEqual(utc(2023, 2, 28));
    expect(shiftDate(utc(2026, 3, 31), '1 month ago')).toEqual(utc(2026, 2, 28));
    expect(shiftDate(utc(2026, 11, 9), '28 days ago')).toEqual(utc(2026, 10, 12));
    expect(shiftDate(utc(2026, 11, 9), '2 weeks ago')).toEqual(utc(2026, 10, 26));
    expect(shiftDate(utc(2026, 11, 9), 'yesterday-ish')).toBeUndefined();
  });

  it('shifts a closed range, whose end is excluded', () => {
    const range = parseRange('2026-09-01 : 2026-10-01');
    expect(range).toBeDefined();
    const shifted = shiftRange(range!, '1 year ago');
    expect(shifted && formatRange(shifted, 'it')).toBe('01/09/2025 al 30/09/2025');
  });

  it('formats the readable range in the language of the chart', () => {
    const range = parseRange('2026-10-01 : 2026-11-01')!;
    expect(formatRange(range, 'it')).toBe('01/10/2026 al 31/10/2026');
    expect(formatRange(range, 'en')).toBe('2026-10-01 to 2026-10-31');
  });

  it('rejects open or inverted ranges', () => {
    expect(parseRange('No filter')).toBeUndefined();
    expect(parseRange('2026-10-01 : 2026-10-01')).toBeUndefined();
    expect(parseRange(undefined)).toBeUndefined();
  });

  it('finds the T1 range in the time range or in a temporal filter, never in "No filter"', () => {
    expect(getQueryTimeRange({ extra_form_data: { time_range: '2026-10-01 : 2026-11-01' } })).toBeDefined();
    expect(
      getQueryTimeRange({ extra_form_data: { filters: [{ op: 'TEMPORAL_RANGE', val: '2026-10-01 : 2026-11-01' }] } }),
    ).toBeDefined();
    expect(getQueryTimeRange({ extra_form_data: { filters: [{ op: 'TEMPORAL_RANGE', val: 'No filter' }] } })).toBeUndefined();
  });

  it('names the shifts in both languages', () => {
    expect(shiftName('1 year ago', 'it')).toBe('Anno precedente');
    expect(shiftName('1 month ago', 'en')).toBe('Previous month');
    expect(shiftName('28 days ago', 'it')).toBe('28 giorni prima');
  });
});

describe('comparison in transformProps', () => {
  const data = [
    { state: 'CA', regime: 'A', sum__num: 110, 'sum__num__1 year ago': 100 },
    { state: 'NY', regime: 'A', sum__num: 40, 'sum__num__1 year ago': 60 },
  ];
  const run = (formData: Record<string, unknown>, rows = data) =>
    transformProps({
      width: 800,
      height: 500,
      formData: {
        viz_type: 'stratum_bar',
        datasource: '1__table',
        x_axis: 'state',
        metrics: ['sum__num'],
        ...formData,
      },
      queriesData: [{ data: rows }],
    } as unknown as ChartProps);

  it('ignores a comparison metric left in a chart whose comparison is off', () => {
    const props = run({ time_comparison_mode: 'none', comparison_metric: 'sum__num__1 year ago' });
    expect(props.series).toHaveLength(1);
    expect(props.comparison?.active).toBe(false);
  });

  it('explains why the comparison is missing when the shift has no closed period in the filter', () => {
    // Without a closed T1 range buildQuery asks for no offset, so the query returns no offset column
    const noOffsetRows = data.map(({ 'sum__num__1 year ago': _ignored, ...row }) => row);
    const props = run({ time_comparison_mode: 'time_shift', extra_form_data: { time_range: 'No filter' } }, noOffsetRows);
    expect(props.comparison?.active).toBe(false);
    expect(props.comparison?.notice).toContain('Calendar Filter');
    expect(props.series).toHaveLength(1);
  });

  it('draws the shifted period next to the current one, named with its readable range', () => {
    const props = run({
      time_comparison_mode: 'time_shift',
      comparison_shift: '1 year ago',
      extra_form_data: { time_range: '2026-09-01 : 2026-10-01' },
    });
    expect(props.comparison?.active).toBe(true);
    expect(props.comparison?.notice).toBeUndefined();
    expect(props.series).toHaveLength(2);
    expect(props.series[0].name).toBe('Periodo corrente · 01/09/2026 al 30/09/2026');
    expect(props.series[1].name).toBe('Anno precedente · 01/09/2025 al 30/09/2025');
    expect(props.series[1].data).toEqual([100, 60]);
  });

  it('keeps the labels typed in the control panel and ignores the old English defaults', () => {
    const props = run({
      time_comparison_mode: 'time_shift',
      time1_label: 'Ottobre 2026',
      time_2_label: 'Time 2 (comparison)',
      extra_form_data: { time_range: '2026-10-01 : 2026-11-01' },
    });
    expect(props.series[0].name).toBe('Ottobre 2026');
    expect(props.series[1].name).toBe('Anno precedente · 01/10/2025 al 31/10/2025');
  });

  it('shows one pair of bars per combination of category and series when a breakdown is set', () => {
    const props = run({
      time_comparison_mode: 'time_shift',
      groupby: ['regime'],
      extra_form_data: { time_range: '2026-09-01 : 2026-10-01' },
    });
    expect(props.categories).toEqual(['CA · A', 'NY · A']);
    expect(props.series[0].data).toEqual([110, 40]);
    expect(props.series[1].data).toEqual([100, 60]);
  });
});

describe('delta badge in the tooltip', () => {
  const items = [
    { seriesName: 'Periodo corrente', value: 50, seriesIndex: 0, color: '#1c3d5e', data: 50 },
    { seriesName: 'Anno precedente', value: 100, seriesIndex: 1, color: '#7aa8cf', data: 100 },
  ];
  const comparison = (polarity: 'normal' | 'inverted') => ({
    mode: 'time_shift' as const,
    active: true,
    t1Name: 'Periodo corrente',
    t2Name: 'Anno precedente',
    showDelta: true,
    polarity,
    locale: 'it' as const,
  });

  it('shows a fall in green when the polarity is inverted (waiting times, costs)', () => {
    const html = getTooltipFormatter(['CA'], false, ['#1c3d5e'], false, undefined, undefined, undefined, undefined, false, true, comparison('inverted'))(items);
    expect(html).toContain('Scostamento (T1 vs T2):');
    expect(html).toContain('#2E7D32');
  });

  it('shows the same fall in red with normal polarity', () => {
    const html = getTooltipFormatter(['CA'], false, ['#1c3d5e'], false, undefined, undefined, undefined, undefined, false, true, comparison('normal'))(items);
    expect(html).toContain('#D32F2F');
  });

  it('shows no badge without a comparison', () => {
    const html = getTooltipFormatter(['CA'], false, ['#1c3d5e'], false, undefined, undefined, undefined, undefined, false, true, undefined)(items);
    expect(html).not.toContain('Scostamento');
  });
});
