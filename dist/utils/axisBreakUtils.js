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
        // 'auto' mode:
        // Support single or multiple extreme outliers (e.g. [8, 7, 73, 1200, 1331]).
        // We analyze the sorted values to locate the primary breakpoint between normal distribution and extreme outliers.
        const midIdx = Math.floor(values.length / 2);
        const median = values[midIdx] || 1;
        let bestGapIdx = -1;
        let maxJumpRatio = 0;
        // Check jumps in the upper half of the distribution
        for (let i = values.length - 1; i >= Math.max(1, Math.floor(values.length * 0.4)); i--) {
            const curr = values[i];
            const prev = values[i - 1];
            if (prev > 0) {
                const ratio = curr / prev;
                // Significant discontinuity: ratio >= 2.0 and value is far above median
                if (ratio >= 2.0 && curr > median * 2.5 && curr > 10) {
                    if (ratio > maxJumpRatio) {
                        maxJumpRatio = ratio;
                        bestGapIdx = i;
                    }
                }
            }
        }
        if (bestGapIdx > 0) {
            const highestNormal = values[bestGapIdx - 1];
            cutoff = Math.ceil(highestNormal * 1.25);
        }
        else if (values.length > 1 && maxOriginalVal > values[values.length - 2] * 1.8 && maxOriginalVal > median * 2.5 && maxOriginalVal > 10) {
            cutoff = Math.ceil(values[values.length - 2] * 1.25);
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