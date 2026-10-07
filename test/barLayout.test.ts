import { calculateAxisBreak } from '../src/utils/axisBreakUtils';
import {
  compute2DValueExtent,
  compute3DAxisMax,
  compute3DStackLayout,
  getBarBorderRadius,
} from '../src/utils/barLayout';
import { StratumBarSeries } from '../src/types';

function s(name: string, data: (number | null)[], yAxisIndex = 0): StratumBarSeries {
  return { name, key: name, data, items: [], yAxisIndex };
}

const noBreak = calculateAxisBreak([], false, 0, { enabled: false });

describe('compute3DStackLayout', () => {
  const series = [s('A', [10, 0, 5]), s('B', [20, 30, null]), s('Line', [999, 999, 999], 1)];

  it('accumulates stack bottoms and tracks the topmost positive segment per category', () => {
    const layout = compute3DStackLayout(series, 3, true, noBreak);
    expect(layout.stackBottoms).toEqual([
      [0, 0, 0],
      [10, 0, 0],
      [0, 0, 0],
    ]);
    expect(layout.topSeriesIdxPerCat).toEqual([1, 1, 0]);
    expect(layout.maxStackedSum).toBe(30);
    expect(layout.maxSingleVal).toBe(30);
  });

  it('does not stack in grouped mode but still tracks the single maximum', () => {
    const layout = compute3DStackLayout(series, 3, false, noBreak);
    expect(layout.stackBottoms.flat().every(v => v === 0)).toBe(true);
    expect(layout.topSeriesIdxPerCat).toEqual([-1, -1, -1]);
    expect(layout.maxStackedSum).toBe(0);
    expect(layout.maxSingleVal).toBe(30);
  });

  it('measures values in axis-break visual space', () => {
    const outliers = [s('A', [8, 7, 73, 1331])];
    const axisBreak = calculateAxisBreak(outliers, false, 4, { enabled: true, mode: 'auto' });
    expect(axisBreak.enabled).toBe(true);
    const layout = compute3DStackLayout(outliers, 4, false, axisBreak);
    expect(layout.maxSingleVal).toBeLessThan(1331);
    expect(layout.maxSingleVal).toBeGreaterThan(axisBreak.effectiveCutoff);
  });
});

describe('compute3DAxisMax', () => {
  const layout = { maxStackedSum: 300, maxSingleVal: 200 };
  const base = { layout, axisBreak: noBreak, showBenchmark: false, valuePosition: 'top' as const };

  it('adds 15% headroom to the grouped or stacked ceiling', () => {
    expect(compute3DAxisMax({ ...base, isStacked: false })).toBe(230);
    expect(compute3DAxisMax({ ...base, isStacked: true })).toBe(345);
  });

  it('adds 25% headroom for slanted labels', () => {
    expect(compute3DAxisMax({ ...base, isStacked: false, valuePosition: 'slanted' })).toBe(250);
  });

  it('raises the ceiling to a visible benchmark above the data', () => {
    const benchmark = { value: 400, label: 'T' };
    expect(compute3DAxisMax({ ...base, isStacked: false, showBenchmark: true, benchmark })).toBe(460);
    expect(compute3DAxisMax({ ...base, isStacked: false, showBenchmark: false, benchmark })).toBe(230);
  });

  it('returns undefined for an empty or non-positive ceiling', () => {
    expect(compute3DAxisMax({ ...base, layout: { maxStackedSum: 0, maxSingleVal: 0 }, isStacked: false })).toBeUndefined();
  });
});

describe('compute2DValueExtent', () => {
  const series = [s('A', [10, -5, 30]), s('B', [20, -15, null]), s('Sec', [500, -500, 0], 1)];

  it('uses single extremes when not stacked, ignoring the secondary axis', () => {
    expect(compute2DValueExtent(series, 3, false)).toEqual({ maxVal: 30, minVal: -15 });
  });

  it('uses per-category positive/negative sums when stacked', () => {
    expect(compute2DValueExtent(series, 3, true)).toEqual({ maxVal: 30, minVal: -20 });
  });

  it('widens the extent to include the benchmark', () => {
    expect(compute2DValueExtent(series, 3, false, { value: 100, label: 'T' })).toEqual({ maxVal: 100, minVal: -15 });
    expect(compute2DValueExtent(series, 3, false, { value: -40, label: 'T' })).toEqual({ maxVal: 30, minVal: -40 });
  });
});

describe('getBarBorderRadius', () => {
  it('rounds only the end pointing away from the baseline', () => {
    expect(getBarBorderRadius(true, 6)).toEqual([6, 6, 0, 0]);
    expect(getBarBorderRadius(true, 6, true)).toEqual([0, 0, 6, 6]);
    expect(getBarBorderRadius(false, 6)).toEqual([0, 6, 6, 0]);
    expect(getBarBorderRadius(false, 6, true)).toEqual([6, 0, 0, 6]);
  });
});
