import { BenchmarkConfig } from '../types';
/**
 * Building blocks shared by the 2D and 3D renderers' series loops. Each
 * builder returns a fresh object so callers may mutate the result safely.
 */
/** Selection opacity applied to non-selected bars when a cross-filter is active. */
export declare const UNSELECTED_OPACITY = 0.28;
/**
 * A data point is highlighted when no selection is active, or when the selection
 * contains its category, its series, or the composite `category · series` label.
 */
export declare function isItemSelected(selectedValues: string[] | undefined, categoryName: string, seriesName: string): boolean;
export declare function getItemOpacity(isSelected: boolean): number;
export declare function formatBenchmarkLabel(benchmark: BenchmarkConfig): string;
export declare function getBenchmarkLineStyle(): {
    color: string;
    type: string;
    width: number;
};
export declare function getBenchmarkLabel(benchmark: BenchmarkConfig, position: 'start' | 'end'): {
    position: "end" | "start";
    formatter: string;
    color: string;
    fontSize: number;
    fontWeight: number;
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
    padding: number[];
};
/** markLine data item for the dashed "// Taglio Asse" cutoff of an active axis break. */
export declare function getAxisBreakCutLine(isVertical: boolean, isDark: boolean, cutoff: number): any;
export interface SmartAnnotationStyle {
    symbolSize: number;
    fontSize: number;
    /** Alpha of the pin fill (white on dark theme, black on light theme). */
    fillAlpha: number;
    shadowBlur: number;
    shadowAlpha: number;
}
export declare const SMART_ANNOTATION_STYLE_2D: SmartAnnotationStyle;
export declare const SMART_ANNOTATION_STYLE_3D: SmartAnnotationStyle;
export declare function formatSmartAnnotation(params: any): string;
/** Max/min pin annotations (markPoint) attached to a bar series. */
export declare function getSmartAnnotationMarkPoint(baseColor: string, isDark: boolean, style: SmartAnnotationStyle): {
    symbol: string;
    symbolSize: number;
    label: {
        show: boolean;
        color: string;
        fontWeight: string;
        formatter: typeof formatSmartAnnotation;
        fontSize: number;
    };
    itemStyle: {
        color: string;
        borderColor: string;
        borderWidth: number;
        shadowBlur: number;
        shadowColor: string;
    };
    data: {
        type: string;
        name: string;
    }[];
};
/** Value label of line series: percentage for `.2%` secondary axes, Italian locale otherwise. */
export declare function formatLineSeriesValue(value: any, yAxis2Format?: string): string;
export interface LineSeriesOptions {
    name: string;
    data: any[];
    baseColor: string;
    isVertical: boolean;
    yAxisIndex?: number;
    isDark: boolean;
    showValue: boolean;
    yAxis2Format?: string;
    lineWidth: number;
    areaGradient: boolean;
    /** Alpha of the glow under the line stroke. */
    shadowAlpha: number;
    /** Alpha at the top of the area gradient. */
    areaAlpha: number;
    z: number;
}
/** Smooth line series (with optional area gradient) used for secondary metrics. */
export declare function buildLineSeries(options: LineSeriesOptions): any;
/**
 * Places category/value axes on x/y according to orientation; with a dual axis
 * the secondary value axis follows the primary one.
 */
export declare function arrangeAxes<C, V, S>(isVertical: boolean, hasDualYAxis: boolean | undefined, categoryAxis: C, valueAxis: V, secondaryValueAxis: S): {
    xAxis: C | V | (V | S)[];
    yAxis: C | V | (V | S)[];
};
//# sourceMappingURL=seriesScaffolding.d.ts.map