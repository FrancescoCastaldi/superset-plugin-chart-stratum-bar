/**
 * Computes whether an axis break / outlier capping should be active and what the cutoff threshold is.
 *
 * Mode:
 * - 'auto': Detects if maxVal > 2.0 * secondHighest (or 2.5 * median) and sets cutoff to reasonable upper bound
 * - 'p90': 90th percentile of data
 * - 'p95': 95th percentile of data
 * - 'manual': Custom user-specified threshold
 */
export function calculateAxisBreak(series, isStacked, numCategories, options) {
    const { enabled = false, mode = 'auto', threshold } = options;
    if (!enabled || numCategories === 0) {
        return {
            enabled: false,
            effectiveCutoff: Infinity,
            maxOriginalVal: 0,
            hasOutliers: false,
            displayMax: 0,
            compressionRatio: 1,
        };
    }
    // Collect primary bar values (ignore secondary yAxisIndex === 1)
    const primarySeries = series.filter(s => s.yAxisIndex !== 1);
    if (primarySeries.length === 0) {
        return {
            enabled: false,
            effectiveCutoff: Infinity,
            maxOriginalVal: 0,
            hasOutliers: false,
            displayMax: 0,
            compressionRatio: 1,
        };
    }
    const values = [];
    if (isStacked) {
        for (let c = 0; c < numCategories; c++) {
            let sum = 0;
            for (const s of primarySeries) {
                const v = s.data[c];
                if (typeof v === 'number' && !isNaN(v) && v > 0) {
                    sum += v;
                }
            }
            if (sum > 0)
                values.push(sum);
        }
    }
    else {
        for (const s of primarySeries) {
            for (let c = 0; c < numCategories; c++) {
                const v = s.data[c];
                if (typeof v === 'number' && !isNaN(v) && v > 0) {
                    values.push(v);
                }
            }
        }
    }
    if (values.length === 0) {
        return {
            enabled: false,
            effectiveCutoff: Infinity,
            maxOriginalVal: 0,
            hasOutliers: false,
            displayMax: 0,
            compressionRatio: 1,
        };
    }
    values.sort((a, b) => a - b);
    const maxOriginalVal = values[values.length - 1];
    const minVal = values[0];
    let cutoff = Infinity;
    if (mode === 'manual' && typeof threshold === 'number' && threshold > 0) {
        cutoff = threshold;
    }
    else if (mode === 'p90') {
        const idx = Math.min(Math.floor(values.length * 0.9), values.length - 1);
        cutoff = Math.max(values[idx], minVal * 1.5);
    }
    else if (mode === 'p95') {
        const idx = Math.min(Math.floor(values.length * 0.95), values.length - 1);
        cutoff = Math.max(values[idx], minVal * 1.5);
    }
    else {
        // 'auto' mode
        // To detect outliers without the outlier itself inflating the upper quartile:
        // We check against the non-outlier distribution (values excluding the highest)
        const normalValues = values.length > 1 ? values.slice(0, values.length - 1) : values;
        const midIdx = Math.floor(normalValues.length / 2);
        const median = normalValues[midIdx] || 1;
        const q3Idx = Math.min(Math.floor(normalValues.length * 0.75), normalValues.length - 1);
        const q3 = normalValues[q3Idx] || median;
        // Second highest value (to preserve full scaling across all other normal bars)
        const secondHighest = normalValues[normalValues.length - 1];
        // Outlier condition: max is significantly greater than second highest (e.g. > 1.8x) or median * 2.5
        if (values.length > 1 && (maxOriginalVal > secondHighest * 1.8 || maxOriginalVal > median * 2.5) && maxOriginalVal > 10) {
            // Cutoff nicely positioned slightly above second highest so normal bars occupy 80-85% of chart
            cutoff = Math.ceil(secondHighest * 1.25);
        }
        else {
            cutoff = maxOriginalVal;
        }
    }
    const hasOutliers = maxOriginalVal > cutoff && cutoff > 0;
    // If outliers exist:
    // Normal range [0, cutoff] takes ~82% of visual height.
    // Broken outlier zone takes the top ~18% (up to displayMax = cutoff * 1.20).
    const displayMax = hasOutliers ? Math.ceil(cutoff * 1.20) : Math.ceil(maxOriginalVal * 1.15);
    const compressionRatio = (hasOutliers && maxOriginalVal > cutoff)
        ? (displayMax * 0.95 - cutoff) / (maxOriginalVal - cutoff)
        : 1;
    return {
        enabled: hasOutliers,
        effectiveCutoff: cutoff,
        maxOriginalVal,
        hasOutliers,
        displayMax,
        compressionRatio,
    };
}
/**
 * Transforms a raw metric value for visual plotting when Axis Break is active.
 * - Non-positive values: returned as-is.
 * - Values <= cutoff: scaled proportionally within [0, cutoff].
 * - Values > cutoff: mapped smoothly into the break zone with 'isCapped: true'.
 */
export function transformValueForAxisBreak(val, breakConfig) {
    if (val === null || val === undefined || isNaN(val)) {
        return { visualVal: null, isCapped: false, originalVal: null };
    }
    if (!breakConfig.enabled || val <= breakConfig.effectiveCutoff) {
        return { visualVal: val, isCapped: false, originalVal: val };
    }
    // Value exceeds cutoff: Pin into the outlier break zone [cutoff, displayMax * 0.96]
    const excess = val - breakConfig.effectiveCutoff;
    const mapped = breakConfig.effectiveCutoff + excess * breakConfig.compressionRatio;
    const cappedVisualVal = Math.round(mapped * 100) / 100;
    return { visualVal: cappedVisualVal, isCapped: true, originalVal: val };
}
//# sourceMappingURL=axisBreakUtils.js.map