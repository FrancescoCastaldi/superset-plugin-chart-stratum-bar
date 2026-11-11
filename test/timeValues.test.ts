import { ChartProps } from '@superset-ui/core';
import transformProps from '../src/plugin/transformProps';
import { get2DBarOption } from '../src/components/renderers2D';
import { get3DBarOption } from '../src/components/renderers3D';
import {
  convertTimeColumns,
  formatDuration,
  isTimeColumn,
  niceTimeInterval,
  parseTimeToSeconds,
} from '../src/utils/timeValues';

describe('parseTimeToSeconds', () => {
  it('reads the clock formats Superset sends for Time fields', () => {
    expect(parseTimeToSeconds('00:12:54.425000')).toBeCloseTo(774.425, 6);
    expect(parseTimeToSeconds('00:03:16')).toBe(196);
    expect(parseTimeToSeconds('1:02:03')).toBe(3723);
    expect(parseTimeToSeconds('26:10:00')).toBe(94200);
    expect(parseTimeToSeconds('00:00:00')).toBe(0);
  });

  it('reads durations with days and ISO durations', () => {
    expect(parseTimeToSeconds('1 day, 2:03:04')).toBe(86400 + 7384);
    expect(parseTimeToSeconds('0 days 00:12:54.425000')).toBeCloseTo(774.425, 6);
    expect(parseTimeToSeconds('PT12M54S')).toBe(774);
    expect(parseTimeToSeconds('PT1H')).toBe(3600);
    expect(parseTimeToSeconds('-00:00:30')).toBe(-30);
  });

  it('refuses what is not a full time', () => {
    expect(parseTimeToSeconds('12:54')).toBeNull();
    expect(parseTimeToSeconds('Sportello')).toBeNull();
    expect(parseTimeToSeconds('2026-01-01 00:12:54')).toBeNull();
    expect(parseTimeToSeconds('00:61:00')).toBeNull();
    expect(parseTimeToSeconds('P')).toBeNull();
    expect(parseTimeToSeconds('')).toBeNull();
    expect(parseTimeToSeconds(125)).toBeNull();
    expect(parseTimeToSeconds(null)).toBeNull();
  });
});

describe('formatDuration', () => {
  it('writes mm:ss, or h:mm:ss when an hour is on the chart (automatic)', () => {
    expect(formatDuration(774.425)).toBe('12:54');
    expect(formatDuration(196)).toBe('03:16');
    expect(formatDuration(3723)).toBe('1:02:03');
    expect(formatDuration(600, { referenceSeconds: 7200 })).toBe('0:10:00');
  });

  it('rounds before splitting, so 59.6 seconds is 01:00 and not 00:60', () => {
    expect(formatDuration(59.6)).toBe('01:00');
    expect(formatDuration(3599.6)).toBe('1:00:00');
  });

  it('keeps the decimals asked for', () => {
    expect(formatDuration(774.425, { fractionDigits: 3 })).toBe('12:54.425');
    expect(formatDuration(774.425, { fractionDigits: 1 })).toBe('12:54.4');
  });

  it('supports the fixed and decimal formats', () => {
    expect(formatDuration(3930, { format: 'hms' })).toBe('1:05:30');
    expect(formatDuration(3930, { format: 'ms' })).toBe('65:30');
    expect(formatDuration(3930, { format: 'minutes', fractionDigits: 1 })).toBe('65,5 min');
    expect(formatDuration(3930, { format: 'hours', fractionDigits: 2 })).toBe('1,09 h');
    expect(formatDuration(-30)).toBe('-00:30');
  });
});

describe('time columns', () => {
  const rows = [
    { Mese: 'August', Attesa: '00:12:54.425000', Conteggio: 4, Fascia: '08:00:00' },
    { Mese: 'September', Attesa: null, Conteggio: 6, Fascia: '13:00:00' },
  ];

  it('recognizes a column only when every value is a time', () => {
    expect(isTimeColumn(rows, 'Attesa')).toBe(true);
    expect(isTimeColumn(rows, 'Mese')).toBe(false);
    expect(isTimeColumn(rows, 'Conteggio')).toBe(false);
    expect(isTimeColumn([{ a: null }], 'a')).toBe(false);
  });

  it('converts only the wanted columns and leaves the rest untouched', () => {
    const { rows: converted, timeKeys } = convertTimeColumns(rows, ['attesa', 'Conteggio']);
    expect(timeKeys).toEqual(['Attesa']);
    expect(converted[0].Attesa).toBeCloseTo(774.425, 6);
    expect(converted[1].Attesa).toBeNull();
    expect(converted[0].Fascia).toBe('08:00:00');
    expect(rows[0].Attesa).toBe('00:12:54.425000');
  });
});

describe('niceTimeInterval', () => {
  it('gives round steps', () => {
    expect(niceTimeInterval(1982)).toBe(600);
    expect(niceTimeInterval(45)).toBe(10);
    expect(niceTimeInterval(7200)).toBe(1800);
    expect(niceTimeInterval(0)).toBeUndefined();
  });
});

describe('StratumBar with Time metrics', () => {
  // The case of the Explore screen: four waiting times by month, as Superset sends them
  const data = [
    {
      Mese: 'August',
      'Attesa Sportello': '00:12:54.425000',
      'Tempo Gestione Sportello': '00:03:16.898000',
      'Attesa Sala': '00:15:37.222000',
      'Durata Prelievo': '00:03:37.042000',
    },
    {
      Mese: 'September',
      'Attesa Sportello': '00:16:08.867000',
      'Tempo Gestione Sportello': '00:03:14.490000',
      'Attesa Sala': '00:18:36.022000',
      'Durata Prelievo': '00:03:21.976000',
    },
  ];
  const metrics = ['Attesa Sportello', 'Tempo Gestione Sportello', 'Attesa Sala', 'Durata Prelievo'];

  const build = (extra: Record<string, unknown> = {}, rows: any[] = data) =>
    transformProps({
      width: 800,
      height: 500,
      formData: {
        viz_type: 'stratum_bar',
        datasource: '1__table',
        x_axis: 'Mese',
        metrics,
        viewMode: '2d',
        ...extra,
      },
      queriesData: [{ data: rows }],
    } as unknown as ChartProps);

  it('draws the Time metrics as bars measured in seconds', () => {
    const props = build();
    expect(props.categories).toEqual(['August', 'September']);
    expect(props.series.map(s => s.name)).toEqual(metrics);
    expect(props.series[0].data[0]).toBeCloseTo(774.425, 6);
    expect(props.series[2].data[1]).toBeCloseTo(1116.022, 6);
    expect(props.series.every(s => s.valueKind === 'time')).toBe(true);
    expect(props.series[0].items[0].formattedValue).toBe('12:54');
    expect(props.timeFormat?.referenceSeconds).toBeCloseTo(1116.022, 6);
  });

  it('writes the axis, the bar labels and the tooltip as durations', () => {
    const props = build();
    const option: any = get2DBarOption(props);
    const valueAxis = option.yAxis;
    expect(valueAxis.interval).toBe(300);
    expect(valueAxis.max).toBe(1200);
    expect(valueAxis.axisLabel.formatter(600)).toBe('10:00');
    expect(valueAxis.axisLabel.formatter(0)).toBe('00:00');

    const label = option.series[0].label.formatter({ value: 774.425, data: { originalVal: 774.425 } });
    expect(label).toBe('12:54');

    const html: string = option.tooltip.formatter([
      { seriesName: 'Attesa Sportello', value: 774.425, data: { value: 774.425 }, seriesIndex: 0, color: '#123456' },
    ]);
    expect(html).toContain('12:54');
    expect(html).not.toContain('774');
  });

  it('draws the 3D axis as durations too', () => {
    const option: any = get3DBarOption(build({ viewMode: '3d' }));
    expect(option.yAxis.axisLabel.formatter(900)).toBe('15:00');
    expect(option.yAxis.interval).toBeGreaterThanOrEqual(300);
  });

  it('follows the display format and the decimals chosen', () => {
    const props = build({ time_display_format: 'minutes', time_fraction_digits: 1 });
    expect(props.series[0].items[0].formattedValue).toBe('12,9 min');
    const hms = build({ time_display_format: 'hms', time_fraction_digits: 3 });
    expect(hms.series[0].items[0].formattedValue).toBe('0:12:54.425');
  });

  it('writes a fixed benchmark in seconds as a duration', () => {
    const props = build({ showBenchmark: true, benchmarkType: 'fixed_value', benchmarkValue: 600 });
    expect(props.benchmark?.value).toBe(600);
    expect(props.benchmark?.display).toBe('10:00');
    const option: any = get2DBarOption(props);
    const labelText: string = option.series[0].markLine.data[0].label.formatter;
    expect(labelText).toContain('10:00');
    expect(labelText).not.toContain('600');
  });

  it('leaves the values as they are when the detection is off', () => {
    const props = build({ time_detection: 'off' });
    expect(props.series.every(s => s.valueKind === undefined)).toBe(true);
    expect(props.timeFormat).toBeUndefined();
  });

  it('never touches the categories, even when they look like times', () => {
    const rows = [
      { Fascia: '08:00:00', 'Attesa Sala': '00:10:00' },
      { Fascia: '13:00:00', 'Attesa Sala': '00:20:00' },
    ];
    const props = build({ x_axis: 'Fascia', metrics: ['Attesa Sala'] }, rows);
    expect(props.categories).toEqual(['08:00:00', '13:00:00']);
    expect(props.series[0].data).toEqual([600, 1200]);
  });

  it('does not change charts of numbers', () => {
    const props = build({ metrics: ['richieste'] }, [
      { Mese: 'August', richieste: 1200 },
      { Mese: 'September', richieste: 800 },
    ]);
    expect(props.timeFormat).toBeUndefined();
    expect(props.series[0].valueKind).toBeUndefined();
    const option: any = get2DBarOption(props);
    expect(option.yAxis.interval).toBeUndefined();
    expect(option.yAxis.axisLabel.formatter(1200)).toBe('1.2k');
  });

  it('writes the difference between two periods as a duration in the tooltip', () => {
    const props = build({ time_comparison_mode: 'dual_metric', comparison_metric: 'Attesa Sala', metrics: ['Attesa Sportello'] });
    expect(props.series.length).toBe(2);
    expect(props.series.every(s => s.valueKind === 'time')).toBe(true);
    const option: any = get2DBarOption(props);
    const html: string = option.tooltip.formatter([
      { seriesName: props.series[0].name, value: 900, data: { value: 900 }, seriesIndex: 0, color: '#111111' },
      { seriesName: props.series[1].name, value: 600, data: { value: 600 }, seriesIndex: 1, color: '#222222' },
    ]);
    expect(html).toContain('15:00');
    expect(html).toContain('10:00');
    expect(html).toContain('+50.0% (+05:00)');
  });
});
