import { BuildRepresentationOptions, buildSeriesRepresentation } from '../src/plugin/seriesBuilder';
import { adjustColorBrightness } from '../src/utils/colors';

const formatter = (v: number) => `F${v}`;
const secFormatter = (v: number) => `S${v}`;

function build(overrides: Partial<BuildRepresentationOptions>) {
  const data = overrides.data ?? [];
  return buildSeriesRepresentation({
    data,
    isPivoted: false,
    actualXKey: 'canale',
    actualBreakdownKey: undefined,
    actualMetricKey: 'richieste',
    targetMetricKey: undefined,
    primaryMetric: 'richieste',
    metricList: ['richieste'],
    secondaryMetricList: [],
    y_axis_2_format: '',
    getColor: (key: string, idx: number) => `color-${key}-${idx}`,
    palette: ['#p0', '#p1', '#p2'],
    formatter,
    resolvedXAxis: 'canale',
    secFormatter,
    secondary_line_color: '',
    secondary_series_type: 'line',
    secPalette: ['#s0', '#s1'],
    combineFlag: false,
    sampleRow: data[0] ?? {},
    potentialPivotedKeys: [],
    ...overrides,
  });
}

const flatRows = [
  { canale: 'Web', richieste: 30, target: 25 },
  { canale: 'Cup', richieste: '10', target: 'x' },
  { canale: 'Sportello', richieste: null, target: 5 },
];

describe('buildSeriesRepresentation — single metric', () => {
  it('keeps query order, coerces numeric strings and preserves nulls', () => {
    const { categories, series } = build({ data: flatRows, targetMetricKey: 'target' });
    expect(categories).toEqual(['Web', 'Cup', 'Sportello']);
    expect(series).toHaveLength(1);
    expect(series[0]).toMatchObject({ name: 'richieste', key: 'richieste', color: '#p0', yAxisIndex: 0, seriesType: 'bar' });
    expect(series[0].data).toEqual([30, 10, null]);
    expect(series[0].items.map(i => i.formattedValue)).toEqual(['F30', 'F10', undefined]);
    // Non-numeric targets collapse to null
    expect(series[0].items.map(i => i.targetValue)).toEqual([25, null, 5]);
    expect(series[0].items[0].rawData).toBe(flatRows[0]);
  });

  it('resolves the metric column case-insensitively', () => {
    const { series } = build({
      data: [{ canale: 'Web', RICHIESTE: 7 }],
      actualMetricKey: 'Richieste',
      primaryMetric: 'richieste',
    });
    expect(series[0].data).toEqual([7]);
  });

  it('falls back to the first numeric non-axis column', () => {
    const { series } = build({
      data: [{ canale: 'Web', __timestamp: 1, totale: 42 }],
      actualMetricKey: 'missing',
      primaryMetric: 'missing',
    });
    expect(series[0].data).toEqual([42]);
  });
});

describe('buildSeriesRepresentation — sorting', () => {
  const rows = [
    { canale: '18-22', richieste: 5 },
    { canale: '8-13', richieste: 50 },
    { canale: '13-18', richieste: 20 },
  ];

  it('sorts categories chronologically when sortBy is category', () => {
    expect(build({ data: rows, sortBy: 'category' }).categories).toEqual(['8-13', '13-18', '18-22']);
    expect(build({ data: rows, sortBy: 'category', isOrderDesc: true }).categories).toEqual(['18-22', '13-18', '8-13']);
  });

  it('sorts categories by metric total when sortBy is metric', () => {
    expect(build({ data: rows, sortBy: 'metric' }).categories).toEqual(['18-22', '13-18', '8-13']);
    expect(build({ data: rows, sortBy: 'metric', isOrderDesc: true }).categories).toEqual(['8-13', '13-18', '18-22']);
  });
});

describe('buildSeriesRepresentation — multiple metrics', () => {
  it('creates one bar series per metric colored from the palette', () => {
    const { series } = build({
      data: [{ canale: 'Web', a: 1, b: 2 }, { canale: 'Cup', a: 3, B: 4 }],
      metricList: ['a', 'b'],
    });
    expect(series.map(s => s.name)).toEqual(['a', 'b']);
    expect(series.map(s => s.color)).toEqual(['#p0', '#p1']);
    expect(series[0].data).toEqual([1, 3]);
    // Case-insensitive fallback on the column name
    expect(series[1].data).toEqual([2, 4]);
  });
});

describe('buildSeriesRepresentation — breakdown', () => {
  const rows = [
    { canale: 'Web', regime: 'SSN', richieste: 10 },
    { canale: 'Web', regime: 'SSN', richieste: 5 },
    { canale: 'Web', regime: 'Priv', richieste: 3 },
    { canale: 'Cup', regime: 'Priv', richieste: 8 },
  ];

  it('creates one series per breakdown value, summing duplicates and leaving gaps null', () => {
    const { categories, series } = build({ data: rows, actualBreakdownKey: 'regime' });
    expect(categories).toEqual(['Web', 'Cup']);
    expect(series.map(s => s.name)).toEqual(['SSN', 'Priv']);
    expect(series.map(s => s.color)).toEqual(['color-SSN-0', 'color-Priv-1']);
    expect(series[0].data).toEqual([15, null]);
    expect(series[1].data).toEqual([3, 8]);
  });

  it('combines category and breakdown into composite labels when combineFlag is set', () => {
    const { categories, series } = build({
      data: rows.slice(1),
      actualBreakdownKey: 'regime',
      combineFlag: true,
    });
    expect(categories).toEqual(['Web · SSN', 'Web · Priv', 'Cup · Priv']);
    expect(series.map(s => s.name)).toEqual(['SSN', 'Priv']);
    expect(series[0].data).toEqual([5, null, null]);
    expect(series[1].data).toEqual([null, 3, 8]);
  });

  it('ignores a breakdown key absent from the sample row', () => {
    const { series } = build({ data: flatRows, actualBreakdownKey: 'regime' });
    expect(series).toHaveLength(1);
    expect(series[0].name).toBe('richieste');
  });
});

describe('buildSeriesRepresentation — pivoted data', () => {
  it('maps every pivoted column to its own series', () => {
    const data = [
      { canale: 'Web', SSN: 4, Priv: '2' },
      { canale: 'Cup', SSN: null, Priv: 6 },
    ];
    const { categories, series } = build({ data, isPivoted: true, potentialPivotedKeys: ['SSN', 'Priv'] });
    expect(categories).toEqual(['Web', 'Cup']);
    expect(series.map(s => s.key)).toEqual(['SSN', 'Priv']);
    expect(series[0].data).toEqual([4, null]);
    expect(series[1].data).toEqual([2, 6]);
    expect(series[1].color).toBe('color-Priv-1');
  });
});

describe('buildSeriesRepresentation — secondary metrics', () => {
  it('appends averaged secondary series on the second axis', () => {
    const data = [
      { canale: 'Web', richieste: 10, Tasso: 0.2 },
      { canale: 'Web', richieste: 20, Tasso: 0.4 },
      { canale: 'Cup', richieste: 5, Tasso: 'n/a' },
    ];
    const { series } = build({
      data,
      secondaryMetricList: ['tasso', 'altro'],
      secondary_line_color: '#ea580c',
      secondary_series_type: 'bar',
    });
    expect(series).toHaveLength(3);
    const [, tasso, altro] = series;
    expect(tasso).toMatchObject({ name: 'tasso', key: 'sec_tasso', color: '#ea580c', yAxisIndex: 1, seriesType: 'bar' });
    expect(tasso.data[0]).toBeCloseTo(0.3);
    expect(tasso.data[1]).toBeNull();
    expect(tasso.items[0].formattedValue).toBe(`S${tasso.data[0]}`);
    // Only the first secondary series takes the explicit line color
    expect(altro.color).toBe('#s1');
    expect(altro.data).toEqual([null, null]);
  });

  it('defaults the secondary series type to line', () => {
    const { series } = build({
      data: [{ canale: 'Web', richieste: 1, m: 2 }],
      secondaryMetricList: ['m'],
      secondary_series_type: '',
    });
    expect(series[1].seriesType).toBe('line');
    expect(series[1].color).toBe('#s0');
  });
});

describe('buildSeriesRepresentation — dual comparison (R2)', () => {
  it('strictly preserves historical behavior for single metric (t1Display, t2Display, navy & azure colors)', () => {
    const rows = [
      { canale: 'Web', richieste: 100, richieste_prec: 80 },
      { canale: 'Cup', richieste: 50, richieste_prec: 60 },
    ];

    const { series } = build({
      data: rows,
      metricList: ['richieste'],
      primaryMetric: 'richieste',
      actualMetricKey: 'richieste',
      timeComparisonMode: 'time_shift',
      comparisonMetric: 'richieste_prec',
      time1Label: 'Anno 2026',
      time2Label: 'Anno 2025',
    });

    expect(series).toHaveLength(2);
    expect(series[0].name).toBe('Anno 2026');
    expect(series[1].name).toBe('Anno 2025');
    expect(series[0].color).toBe('#1c3d5e');
    expect(series[1].color).toBe('#7aa8cf');
    expect(series[0].data).toEqual([100, 50]);
    expect(series[1].data).toEqual([80, 60]);

    // Deltas: Web 100 vs 80 => +20, +25%
    expect(series[0].items[0].delta).toBe(20);
    expect(series[0].items[0].deltaPercent).toBe(25);
    // Deltas: Cup 50 vs 60 => -10, -16.67%
    expect(series[0].items[1].delta).toBe(-10);
    expect(series[0].items[1].deltaPercent).toBeCloseTo(-16.67, 1);
  });

  it('generates qualified paired series for multi-metric dual comparison with coordinated colors and dedicated deltas', () => {
    const rows = [
      { canale: 'Web', richieste: 100, richieste__prev: 80, accessi: 50, accessi__prev: 60 },
      { canale: 'Cup', richieste: 40, richieste__prev: 0, accessi: 30, accessi__prev: 30 },
    ];

    const compMap = new Map<string, string>([
      ['richieste', 'richieste__prev'],
      ['accessi', 'accessi__prev'],
    ]);

    const { series } = build({
      data: rows,
      metricList: ['richieste', 'accessi'],
      palette: ['#3b82f6', '#10b981'],
      timeComparisonMode: 'time_shift',
      comparisonMetricMap: compMap,
      time1Label: 'T1',
      time2Label: 'T2',
    });

    expect(series).toHaveLength(4);

    // Names: ${mKey} · ${t1Display} / ${mKey} · ${t2Display}
    expect(series[0].name).toBe('richieste · T1');
    expect(series[1].name).toBe('richieste · T2');
    expect(series[2].name).toBe('accessi · T1');
    expect(series[3].name).toBe('accessi · T2');

    // Colors: palette color for T1, coordinated brighter tint for T2
    expect(series[0].color).toBe('#3b82f6');
    expect(series[1].color).toBe(adjustColorBrightness('#3b82f6', 35));
    expect(series[2].color).toBe('#10b981');
    expect(series[3].color).toBe(adjustColorBrightness('#10b981', 35));

    // Data values
    expect(series[0].data).toEqual([100, 40]);
    expect(series[1].data).toEqual([80, 0]);
    expect(series[2].data).toEqual([50, 30]);
    expect(series[3].data).toEqual([60, 30]);

    // Dedicated deltas for richieste
    // Web: 100 vs 80 => delta 20, deltaPercent 25%
    expect(series[0].items[0].delta).toBe(20);
    expect(series[0].items[0].deltaPercent).toBe(25);
    // Cup: 40 vs 0 => isNewBaseline true, deltaPercent null
    expect(series[0].items[1].delta).toBe(40);
    expect(series[0].items[1].isNewBaseline).toBe(true);
    expect(series[0].items[1].deltaPercent).toBeNull();

    // Dedicated deltas for accessi
    // Web: 50 vs 60 => delta -10, deltaPercent -16.67%
    expect(series[2].items[0].delta).toBe(-10);
    expect(series[2].items[0].deltaPercent).toBeCloseTo(-16.67, 1);
    // Cup: 30 vs 30 => delta 0, deltaPercent 0%
    expect(series[2].items[1].delta).toBe(0);
    expect(series[2].items[1].deltaPercent).toBe(0);
    expect(series[2].items[1].isNewBaseline).toBe(false);
  });

  it('handles multi-metric comparison edge cases (missing comparison column, null values)', () => {
    const rows = [
      { canale: 'Web', m1: null, m1__prev: 50, m2: 25 },
      { canale: 'Cup', m1: 30, m1__prev: null, m2: null },
    ];

    const compMap = new Map<string, string>([
      ['m1', 'm1__prev'],
      // m2 has no comparison mapping
    ]);

    const { series } = build({
      data: rows,
      metricList: ['m1', 'm2'],
      palette: ['#0284c7', '#0d9488'],
      timeComparisonMode: 'time_shift',
      comparisonMetricMap: compMap,
      time1Label: 'Current',
      time2Label: 'Previous',
    });

    expect(series).toHaveLength(4);
    // m1 T1 has null in row 0
    expect(series[0].data).toEqual([null, 30]);
    // m1 T2 has null in row 1
    expect(series[1].data).toEqual([50, null]);
    // m1 items with nulls have null deltas
    expect(series[0].items[0].delta).toBeNull();
    expect(series[0].items[0].deltaPercent).toBeNull();
    expect(series[0].items[1].delta).toBeNull();

    // m2 has no comparison values
    expect(series[2].data).toEqual([25, null]);
    expect(series[3].data).toEqual([null, null]);
    expect(series[2].items[0].delta).toBeNull();
  });
});
