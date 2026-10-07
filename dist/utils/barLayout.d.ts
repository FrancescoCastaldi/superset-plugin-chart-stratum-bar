import { BenchmarkConfig, StratumBarSeries, ValuePosition } from '../types';
import { AxisBreakCalculation } from './axisBreakUtils';
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
export declare function compute3DStackLayout(series: StratumBarSeries[], categoryCount: number, isStacked: boolean, axisBreak: AxisBreakCalculation): StackLayout3D;
/**
 * Explicit primary-axis maximum for the 3D custom series (ECharts cannot infer
 * headroom for custom shapes). Slanted labels need extra room above the bars.
 */
export declare function compute3DAxisMax(options: {
    layout: Pick<StackLayout3D, 'maxStackedSum' | 'maxSingleVal'>;
    axisBreak: AxisBreakCalculation;
    isStacked: boolean;
    showBenchmark: boolean;
    benchmark?: BenchmarkConfig;
    valuePosition: ValuePosition;
}): number | undefined;
/**
 * Min/max of the primary 2D value axis: per-category positive/negative sums when
 * stacked, single extremes otherwise. The benchmark always widens the range.
 */
export declare function compute2DValueExtent(series: StratumBarSeries[], categoryCount: number, isStacked: boolean, benchmark?: BenchmarkConfig): {
    maxVal: number;
    minVal: number;
};
/** Bar corner radius, rounding only the end that points away from the baseline. */
export declare function getBarBorderRadius(isVertical: boolean, radius: number, isNegative?: boolean): number[];
//# sourceMappingURL=barLayout.d.ts.map