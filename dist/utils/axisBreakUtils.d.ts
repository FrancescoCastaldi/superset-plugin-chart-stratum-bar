export interface AxisBreakCalculation {
    enabled: boolean;
    effectiveCutoff: number;
    maxOriginalVal: number;
    hasOutliers: boolean;
    displayMax: number;
    compressionRatio: number;
}
/**
 * Computes whether an axis break / outlier capping should be active and what the cutoff threshold is.
 *
 * Mode:
 * - 'auto': Detects if maxVal > 2.0 * secondHighest (or 2.5 * median) and sets cutoff to reasonable upper bound
 * - 'p90': 90th percentile of data
 * - 'p95': 95th percentile of data
 * - 'manual': Custom user-specified threshold
 */
export declare function calculateAxisBreak(series: {
    data: (number | null)[];
    yAxisIndex?: number;
}[], isStacked: boolean, numCategories: number, options: {
    enabled?: boolean;
    mode?: 'auto' | 'p90' | 'p95' | 'manual';
    threshold?: number;
}): AxisBreakCalculation;
/**
 * Transforms a raw metric value for visual plotting when Axis Break is active.
 * - Non-positive values: returned as-is.
 * - Values <= cutoff: scaled proportionally within [0, cutoff].
 * - Values > cutoff: mapped smoothly into the break zone with 'isCapped: true'.
 */
export declare function transformValueForAxisBreak(val: number | null | undefined, breakConfig: AxisBreakCalculation): {
    visualVal: number | null;
    isCapped: boolean;
    originalVal: number | null;
};
//# sourceMappingURL=axisBreakUtils.d.ts.map