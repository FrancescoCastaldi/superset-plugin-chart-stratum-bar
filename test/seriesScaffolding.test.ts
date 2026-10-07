import {
  SMART_ANNOTATION_STYLE_2D,
  SMART_ANNOTATION_STYLE_3D,
  UNSELECTED_OPACITY,
  arrangeAxes,
  buildLineSeries,
  formatBenchmarkLabel,
  formatLineSeriesValue,
  formatSmartAnnotation,
  getAxisBreakCutLine,
  getBenchmarkLabel,
  getItemOpacity,
  getSmartAnnotationMarkPoint,
  isItemSelected,
} from '../src/utils/seriesScaffolding';
import { format2DBarLabel, get2DBarLabelConfig } from '../src/components/renderers2D';
import {
  buildAxisBreakMarkElement,
  buildPedestalElements,
  buildPrismElements,
  buildValueLabelElement,
  getBarPalette,
} from '../src/components/isometricShapes';

describe('selection helpers', () => {
  it('selects everything when no selection is active', () => {
    expect(isItemSelected(undefined, 'Web', 'Conv')).toBe(true);
    expect(isItemSelected([], 'Web', 'Conv')).toBe(true);
  });

  it('matches by category, series or composite label', () => {
    expect(isItemSelected(['Web'], 'Web', 'Conv')).toBe(true);
    expect(isItemSelected(['Conv'], 'Cup', 'Conv')).toBe(true);
    expect(isItemSelected(['Cup · Conv'], 'Cup', 'Conv')).toBe(true);
    expect(isItemSelected(['Cup · Conv'], 'Web', 'Conv')).toBe(false);
  });

  it('dims non-selected items', () => {
    expect(getItemOpacity(true)).toBe(1);
    expect(getItemOpacity(false)).toBe(UNSELECTED_OPACITY);
  });
});

describe('benchmark and axis-break mark lines', () => {
  const benchmark = { value: 1234.5, label: 'Target' };

  it('formats the benchmark label in Italian locale', () => {
    expect(formatBenchmarkLabel(benchmark)).toBe('Target: 1234,5');
    expect(getBenchmarkLabel(benchmark, 'end')).toMatchObject({ position: 'end', formatter: 'Target: 1234,5', padding: [3, 6] });
  });

  it('builds the cutoff line on the value axis of the orientation', () => {
    const v = getAxisBreakCutLine(true, false, 12500);
    expect(v.yAxis).toBe(12500);
    expect(v.xAxis).toBeUndefined();
    expect(v.label.formatter).toBe('// Taglio Asse: 12.500');
    expect(v.lineStyle.color).toBe('#9333ea');
    const h = getAxisBreakCutLine(false, true, 10);
    expect(h.xAxis).toBe(10);
    expect(h.lineStyle.color).toBe('#a855f7');
  });
});

describe('smart annotations', () => {
  it('uses trophy for max and down-chart for min', () => {
    expect(formatSmartAnnotation({ type: 'max' })).toBe('🏆');
    expect(formatSmartAnnotation({ type: 'min' })).toBe('📉');
  });

  it('applies the 2D and 3D pin styles', () => {
    const p2 = getSmartAnnotationMarkPoint('#123456', false, SMART_ANNOTATION_STYLE_2D);
    expect(p2.symbolSize).toBe(40);
    expect(p2.itemStyle.color).toBe('rgba(0,0,0,0.15)');
    expect(p2.itemStyle.shadowColor).toBe('rgba(0,0,0,0.2)');
    const p3 = getSmartAnnotationMarkPoint('#123456', true, SMART_ANNOTATION_STYLE_3D);
    expect(p3.symbolSize).toBe(45);
    expect(p3.label.fontSize).toBe(16);
    expect(p3.itemStyle.color).toBe('rgba(255,255,255,0.1)');
    expect(p3.itemStyle.borderColor).toBe('#123456');
    expect(p3.data).toEqual([{ type: 'max', name: 'Max' }, { type: 'min', name: 'Min' }]);
  });
});

describe('line series scaffolding', () => {
  it('formats values as percentage for .2% and Italian locale otherwise', () => {
    expect(formatLineSeriesValue(0.1234, '.2%')).toBe('12.3%');
    expect(formatLineSeriesValue(1234.5)).toBe('1234,5');
    expect(formatLineSeriesValue('abc')).toBe('abc');
    expect(formatLineSeriesValue(null)).toBe('');
  });

  const base = {
    name: 'Tasso',
    data: [1, 2],
    baseColor: '#ff0000',
    isDark: false,
    showValue: true,
    lineWidth: 3,
    shadowAlpha: 0.35,
    areaAlpha: 0.25,
    z: 10,
  };

  it('binds the secondary axis on y when vertical and on x when horizontal', () => {
    const v = buildLineSeries({ ...base, isVertical: true, yAxisIndex: 1, areaGradient: false });
    expect(v.yAxisIndex).toBe(1);
    expect(v.xAxisIndex).toBe(0);
    const h = buildLineSeries({ ...base, isVertical: false, yAxisIndex: 1, areaGradient: false });
    expect(h.yAxisIndex).toBe(0);
    expect(h.xAxisIndex).toBe(1);
    expect(v.areaStyle).toBeUndefined();
  });

  it('applies glow and optional area gradient alphas', () => {
    const l = buildLineSeries({ ...base, isVertical: true, areaGradient: true });
    expect(l.lineStyle.shadowColor).toBe('rgba(255, 0, 0, 0.35)');
    expect(l.areaStyle.color.colorStops[0].color).toBe('rgba(255, 0, 0, 0.25)');
    expect(l.label.formatter({ value: 0.5 })).toBe('0,5');
    expect(l.z).toBe(10);
  });
});

describe('arrangeAxes', () => {
  it('puts the category axis on x when vertical and on y when horizontal', () => {
    expect(arrangeAxes(true, false, 'C', 'V', 'S')).toEqual({ xAxis: 'C', yAxis: 'V' });
    expect(arrangeAxes(false, false, 'C', 'V', 'S')).toEqual({ xAxis: 'V', yAxis: 'C' });
  });

  it('pairs the primary and secondary value axes with a dual axis', () => {
    expect(arrangeAxes(true, true, 'C', 'V', 'S')).toEqual({ xAxis: 'C', yAxis: ['V', 'S'] });
    expect(arrangeAxes(false, true, 'C', 'V', 'S')).toEqual({ xAxis: ['V', 'S'], yAxis: 'C' });
  });
});

describe('2D bar labels', () => {
  it('prefers the original value and marks capped bars', () => {
    const opts = { stacking: 'none' as const, effectiveMaxVal: 100, numberFormat: '' };
    expect(format2DBarLabel({ data: { originalVal: 1500, isCapped: true }, value: 80 }, opts)).toBe('// 1500');
    expect(format2DBarLabel({ data: {}, value: 42 }, opts)).toBe('42');
    expect(format2DBarLabel({ data: {}, value: null }, opts)).toBe('');
    expect(format2DBarLabel({ data: { isCapped: true }, value: 'x' }, opts)).toBe('// x');
  });

  it('hides near-zero segments only when stacked', () => {
    expect(format2DBarLabel({ data: {}, value: 1 }, { stacking: 'stack', effectiveMaxVal: 1000 })).toBe('');
    expect(format2DBarLabel({ data: {}, value: 1 }, { stacking: 'none', effectiveMaxVal: 1000 })).toBe('1');
  });

  it('positions labels by value position and stacking', () => {
    const formatter = () => '';
    const top = get2DBarLabelConfig({ showValue: true, valuePosition: 'top', stacking: 'none', isVertical: false, isDark: false, formatter });
    expect(top).toMatchObject({ position: 'right', align: 'left', verticalAlign: 'middle', color: '#1f2937', textBorderWidth: 1.5 });
    const stacked = get2DBarLabelConfig({ showValue: true, valuePosition: 'top', stacking: 'stack', isVertical: true, isDark: true, formatter });
    expect(stacked).toMatchObject({ position: 'inside', color: '#ffffff', textBorderWidth: 2.5 });
    const slanted = get2DBarLabelConfig({ showValue: true, valuePosition: 'slanted', stacking: 'none', isVertical: false, isDark: false, formatter });
    expect(slanted).toMatchObject({ rotate: -35, align: 'left', verticalAlign: 'middle', distance: 8 });
  });
});

describe('isometric shape elements', () => {
  const offsets = { offsetX: 18, offsetY: 8 };
  const rect = { x0: 10, x1: 30, yTop: 100, yBase: 200 };

  it('derives top and side shades from the base color', () => {
    expect(getBarPalette('#808080')).toEqual({ baseColor: '#808080', topColor: '#d9d9d9', rightColor: '#404040' });
  });

  it('renders 3 vertical and 2 horizontal silent pedestal facets', () => {
    const v = buildPedestalElements({ isVertical: true, isStacked: false, isDark: false, startPt: [100, 400], bandSize: 100, offsets });
    expect(v).toHaveLength(3);
    expect(v.every(e => e.silent && e.z2 === 0)).toBe(true);
    const h = buildPedestalElements({ isVertical: false, isStacked: true, isDark: true, startPt: [50, 200], bandSize: 100, offsets });
    expect(h).toHaveLength(2);
    expect(h[1].style.fill).toBe('rgba(30, 41, 59, 0.8)');
  });

  it('orders prism faces shadow, front, side, top with their z-levels', () => {
    const els = buildPrismElements({ rect, isVertical: true, isDark: false, shadow3D: true, offsets, palette: getBarPalette('#3b82f6') });
    expect(els.map(e => e.z2)).toEqual([1, 2, 1, 3]);
    expect(buildPrismElements({ rect, isVertical: false, isDark: false, shadow3D: false, offsets, palette: getBarPalette('#3b82f6') })[0].style.fill).toBe('#3b82f6');
  });

  it('adds rotation origin only to rotated value labels', () => {
    const flat = buildValueLabelElement('10', { labelX: 1, labelY: 2, textAlign: 'center', textVerticalAlign: 'bottom', rotation: 0, isLightText: false }, false);
    expect(flat.rotation).toBeUndefined();
    expect(flat.style.fill).toBe('#1f2937');
    const rotated = buildValueLabelElement('10', { labelX: 1, labelY: 2, textAlign: 'left', textVerticalAlign: 'middle', rotation: 1, isLightText: true }, true);
    expect(rotated).toMatchObject({ rotation: 1, originX: 1, originY: 2 });
    expect(rotated.style.fill).toBe('#ffffff');
  });

  it('draws the cut mark at the geometry anchor', () => {
    const mark = buildAxisBreakMarkElement(rect, false);
    expect(mark.style).toMatchObject({ text: '//', x: 22, y: 150 });
    expect(mark.z2).toBe(6);
  });
});
