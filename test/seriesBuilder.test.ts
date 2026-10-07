import { BuildRepresentationOptions, buildSeriesRepresentation } from '../src/plugin/seriesBuilder';

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
