import { BenchmarkConfig, StratumBarSeries, ValuePosition } from '../types';
import { AxisBreakCalculation, transformValueForAxisBreak } from './axisBreakUtils';

export interface StackLayout3D {
  /** Accumulated visual value under each segment: stackBottoms[seriesIdx][categoryIdx]. */
  stackBottoms: number[][];
  /** Index of the outermost positive segment per category (-1 when none). */
  topSeriesIdxPerCat: number[];
  maxStackedSum: number;
  maxSingleVal: number;
}

/**
 * Stack bases and scale extremes of the 3D custom series. Values are measured in
 * axis-break visual space and secondary-axis series are ignored.
 */
export function compute3DStackLayout(
  series: StratumBarSeries[],
  categoryCount: number,
  isStacked: boolean,
  axisBreak: AxisBreakCalculation,
): StackLayout3D {
  const stackBottoms: number[][] = series.map(() => Array.from({ length: categoryCount }, () => 0));
  const topSeriesIdxPerCat: number[] = Array.from({ length: categoryCount }, () => -1);
  let maxStackedSum = 0;
  let maxSingleVal = 0;

  for (let c = 0; c < categoryCount; c++) {
    let accum = 0;
    for (let s = 0; s < series.length; s++) {
      if (series[s].yAxisIndex === 1) continue;
      const rawV = series[s].data[c];
      if (typeof rawV === 'number' && !isNaN(rawV)) {
        const visualV = axisBreak.enabled
          ? (transformValueForAxisBreak(rawV, axisBreak).visualVal ?? rawV)
          : rawV;

        if (visualV > maxSingleVal) maxSingleVal = visualV;
        if (isStacked) {
          stackBottoms[s][c] = accum;
          accum += visualV;
          if (visualV > 0) {
            topSeriesIdxPerCat[c] = s;
          }
        }
      }
    }
    if (accum > maxStackedSum) maxStackedSum = accum;
  }

  return { stackBottoms, topSeriesIdxPerCat, maxStackedSum, maxSingleVal };
}

/**
 * Explicit primary-axis maximum for the 3D custom series (ECharts cannot infer
 * headroom for custom shapes). Slanted labels need extra room above the bars.
 */
export function compute3DAxisMax(options: {
  layout: Pick<StackLayout3D, 'maxStackedSum' | 'maxSingleVal'>;
  axisBreak: AxisBreakCalculation;
  isStacked: boolean;
  showBenchmark: boolean;
  benchmark?: BenchmarkConfig;
  valuePosition: ValuePosition;
}): number | undefined {
  const { layout, axisBreak, isStacked, showBenchmark, benchmark, valuePosition } = options;
  let ceilingVal = axisBreak.enabled
    ? axisBreak.displayMax
    : (isStacked ? layout.maxStackedSum : layout.maxSingleVal);

  if (showBenchmark && benchmark && typeof benchmark.value === 'number' && benchmark.value > ceilingVal) {
    ceilingVal = benchmark.value;
  }
  const headroomMultiplier = valuePosition === 'slanted' ? 1.25 : 1.15;
  return ceilingVal > 0 ? Math.ceil(ceilingVal * headroomMultiplier) : undefined;
}

/**
 * Min/max of the primary 2D value axis: per-category positive/negative sums when
 * stacked, single extremes otherwise. The benchmark always widens the range.
 */
export function compute2DValueExtent(
  series: StratumBarSeries[],
  categoryCount: number,
  isStacked: boolean,
  benchmark?: BenchmarkConfig,
): { maxVal: number; minVal: number } {
  let maxVal = 0;
  let minVal = 0;
  if (isStacked) {
    for (let c = 0; c < categoryCount; c++) {
      let posSum = 0;
      let negSum = 0;
      for (const s of series) {
        if (s.yAxisIndex === 1) continue;
        const v = s.data[c];
        if (typeof v === 'number' && !isNaN(v)) {
          if (v > 0) posSum += v;
          else negSum += v;
        }
      }
      if (posSum > maxVal) maxVal = posSum;
      if (negSum < minVal) minVal = negSum;
    }
  } else {
    for (const s of series) {
      if (s.yAxisIndex === 1) continue;
      for (const v of s.data) {
        if (typeof v === 'number' && !isNaN(v)) {
          if (v > maxVal) maxVal = v;
          if (v < minVal) minVal = v;
        }
      }
    }
  }
  if (benchmark && benchmark.value > maxVal) maxVal = benchmark.value;
  if (benchmark && benchmark.value < minVal) minVal = benchmark.value;
  return { maxVal, minVal };
}

/** Bar corner radius, rounding only the end that points away from the baseline. */
export function getBarBorderRadius(isVertical: boolean, radius: number, isNegative = false): number[] {
  if (isVertical) {
    return isNegative ? [0, 0, radius, radius] : [radius, radius, 0, 0];
  }
  return isNegative ? [radius, 0, 0, radius] : [0, radius, radius, 0];
}
