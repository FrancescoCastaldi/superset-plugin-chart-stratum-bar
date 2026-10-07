import { StratumBarSeries, StratumBarTransformedProps } from '../../src/types';

/**
 * Representative renderer inputs used by the characterization suite.
 * The serialized ECharts options produced from these inputs were frozen
 * against the pre-refactor renderers (v0.3.19) in rendererOptions.fixture.json.
 */

function bar(name: string, data: (number | null)[], extra: Partial<StratumBarSeries> = {}): StratumBarSeries {
  return {
    name,
    key: name,
    data,
    items: [],
    yAxisIndex: 0,
    seriesType: 'bar',
    ...extra,
  };
}

function line(name: string, data: (number | null)[], extra: Partial<StratumBarSeries> = {}): StratumBarSeries {
  return {
    name,
    key: `sec_${name}`,
    data,
    items: [],
    yAxisIndex: 1,
    seriesType: 'line',
    color: '#ea580c',
    ...extra,
  };
}

const CATS = ['Sportello', 'Web', 'Cup', 'Farmacia'];

export function makeProps(overrides: Partial<StratumBarTransformedProps>): StratumBarTransformedProps {
  return {
    width: 800,
    height: 500,
    categories: CATS,
    series: [bar('Conv', [150, 280, 90, 40])],
    benchmark: { value: 100, label: 'Target' },
    viewMode: '2d',
    orientation: 'vertical',
    stacking: 'none',
    barShape3D: 'prism',
    depth3D: 20,
    tilt3D: 25,
    shadow3D: true,
    barBorderRadius: 6,
    showTrackBackground: true,
    showBenchmark: true,
    showSmartAnnotations: false,
    showDeltaBadge: true,
    deltaPolarity: 'normal',
    showValue: true,
    valuePosition: 'top',
    numberFormat: ',.0f',
    colorScheme: ['#3b82f6', '#10b981', '#f59e0b'],
    showLegend: true,
    legendOrientation: 'top',
    emitFilter: true,
    enableToolbar: true,
    formData: {} as any,
    ...overrides,
  };
}

export interface RendererCase {
  name: string;
  props: StratumBarTransformedProps;
}

export const cases2D: RendererCase[] = [
  {
    name: '2d-vertical-grouped-track-benchmark',
    props: makeProps({}),
  },
  {
    name: '2d-horizontal-stacked-inside-dark-annotations',
    props: makeProps({
      orientation: 'horizontal',
      stacking: 'stack',
      valuePosition: 'inside',
      themeMode: 'dark',
      showBenchmark: false,
      benchmark: undefined,
      showSmartAnnotations: true,
      legendOrientation: 'left',
      series: [
        bar('Conv', [150, 280, 90, 2]),
        bar('Priv', [60, 120, 30, 0]),
        bar('SSN', [10, null, 45, 5], { color: '#8b5cf6' }),
      ],
    }),
  },
  {
    name: '2d-vertical-signed-slanted',
    props: makeProps({
      valuePosition: 'slanted',
      barBorderRadius: 4,
      showTrackBackground: false,
      benchmark: { value: -20, label: 'Floor' },
      series: [bar('Delta', [35, -42, 12, -5])],
    }),
  },
  {
    name: '2d-vertical-axis-break-auto',
    props: makeProps({
      enableAxisBreak: true,
      axisBreakMode: 'auto',
      numberFormat: '',
      xAxisTitle: 'Canale',
      yAxisTitle: 'Richieste',
      series: [bar('Conv', [8, 7, 73, 1331]), bar('Priv', [5, 9, 60, 1200])],
    }),
  },
  {
    name: '2d-horizontal-dual-axis-selection',
    props: makeProps({
      orientation: 'horizontal',
      hasDualYAxis: true,
      yAxis2Title: 'Tasso',
      yAxis2Format: '.2%',
      secondaryAreaGradient: false,
      secondaryLineWidth: 2,
      selectedValues: ['Web'],
      legendOrientation: 'bottom',
      series: [bar('Conv', [150, 280, 90, 40]), line('Tasso', [0.12, 0.34, null, 0.5])],
    }),
  },
  {
    name: '2d-horizontal-expand-manual-break-a11y',
    props: makeProps({
      orientation: 'horizontal',
      stacking: 'expand',
      enableAxisBreak: true,
      axisBreakMode: 'manual',
      axisBreakThreshold: 300,
      enableA11yDecal: true,
      selectedValues: ['Cup · Priv'],
      series: [bar('Conv', [150, 280, null, 900]), bar('Priv', [60, 120, 30, 400])],
    }),
  },
  {
    name: '2d-vertical-line-gradient-default-format',
    props: makeProps({
      hasDualYAxis: true,
      yAxis2Title: 'Media',
      showBenchmark: false,
      series: [bar('Conv', [150, 280, 90, 40]), line('Media', [100, null, 95.5, 120])],
    }),
  },
];

export const cases3D: RendererCase[] = [
  {
    name: '3d-vertical-prism-grouped-zero-null',
    props: makeProps({
      viewMode: '3d',
      series: [bar('Conv', [150, 0, 90, null]), bar('Priv', [60, 120, 0, 25])],
    }),
  },
  {
    name: '3d-vertical-cylinder-stacked-slanted-dark',
    props: makeProps({
      viewMode: '3d',
      barShape3D: 'cylinder',
      stacking: 'stack',
      valuePosition: 'slanted',
      themeMode: 'dark',
      series: [
        bar('Conv', [150, 280, 90, 3]),
        bar('Priv', [60, 120, 30, 2]),
        bar('SSN', [10, 5, 45, 0]),
      ],
    }),
  },
  {
    name: '3d-horizontal-prism-stacked-inside-selection',
    props: makeProps({
      viewMode: '3d',
      orientation: 'horizontal',
      stacking: 'stack',
      valuePosition: 'inside',
      selectedValues: ['Web', 'Priv'],
      showBenchmark: false,
      series: [bar('Conv', [150, 280, 90, 40]), bar('Priv', [60, 120, 30, 15])],
    }),
  },
  {
    name: '3d-horizontal-cylinder-grouped-axis-break-annotations',
    props: makeProps({
      viewMode: '3d',
      orientation: 'horizontal',
      barShape3D: 'cylinder',
      enableAxisBreak: true,
      axisBreakMode: 'auto',
      showSmartAnnotations: true,
      themeMode: 'dark',
      series: [bar('Conv', [8, 7, 73, 1331]), bar('Priv', [5, 9, 60, 1200])],
    }),
  },
  {
    name: '3d-vertical-prism-dual-axis-line',
    props: makeProps({
      viewMode: '3d',
      hasDualYAxis: true,
      yAxis2Title: 'Tasso',
      yAxis2Format: '.2%',
      shadow3D: false,
      depth3D: 30,
      tilt3D: 40,
      benchmark: { value: 500, label: 'Alto' },
      series: [bar('Conv', [150, 280, 90, 40]), line('Tasso', [0.12, 0.34, null, 0.5])],
    }),
  },
  {
    name: '3d-horizontal-prism-grouped-slanted-negative-tiny',
    props: makeProps({
      viewMode: '3d',
      orientation: 'horizontal',
      valuePosition: 'slanted',
      shadow3D: false,
      showBenchmark: false,
      series: [bar('Delta', [35, -42, 0.5, -0.2]), bar('Base', [1, 2, 3, 400])],
    }),
  },
  {
    name: '3d-vertical-prism-stacked-break-tiny-segments',
    props: makeProps({
      viewMode: '3d',
      stacking: 'stack',
      enableAxisBreak: true,
      axisBreakMode: 'manual',
      axisBreakThreshold: 200,
      showValue: true,
      series: [bar('Conv', [150, 280, 1, 40]), bar('Priv', [2, 900, 30, 15])],
    }),
  },
  {
    name: '3d-vertical-prism-grouped-negative-tiny',
    props: makeProps({
      viewMode: '3d',
      showBenchmark: false,
      series: [bar('Delta', [35, -42, 0.5, -0.2])],
    }),
  },
  {
    name: '3d-horizontal-cylinder-line-overlay-no-value',
    props: makeProps({
      viewMode: '3d',
      orientation: 'horizontal',
      barShape3D: 'cylinder',
      showValue: false,
      hasDualYAxis: true,
      yAxis2Title: 'Media',
      series: [bar('Conv', [150, 280, 90, 40]), line('Media', [100, 110, 95, 120])],
    }),
  },
];
