import { CategoricalColorNamespace, getNumberFormatter, ensureIsArray, } from '@superset-ui/core';
const DEFAULT_COLORS = [
    '#3b82f6', // Sapphire Blue
    '#10b981', // Emerald Green
    '#f59e0b', // Amber Orange
    '#ec4899', // Pink
    '#8b5cf6', // Violet
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#6366f1', // Indigo
];
export default function transformProps(chartProps) {
    const { width, height, formData, queriesData, hooks } = chartProps;
    const fd = (formData || {});
    const data = (queriesData?.[0]?.data || []);
    const { x_axis, groupby = [], metrics = [], target_metric, viewMode = '3d', orientation = 'vertical', stacking = 'none', barShape3D = 'prism', depth3D = 20, tilt3D = 25, shadow3D = true, barBorderRadius = 6, showTrackBackground = false, showBenchmark = false, benchmarkType = 'fixed_value', benchmarkValue = 100, showDeltaBadge = true, deltaPolarity = 'normal', showValue = true, valuePosition = 'top', numberFormat = ',.0f', color_scheme, show_legend = true, legendOrientation = 'top', emit_filter = true, enableToolbar = true, x_axis_title, y_axis_title, } = fd;
    // Resolve Primary Category dimension
    const resolvedXAxis = x_axis || ensureIsArray(groupby)[0] || 'category';
    // Resolve Breakdown dimensions (dimensions other than x_axis)
    const breakdownCols = ensureIsArray(groupby).filter(col => col !== resolvedXAxis);
    const breakdownCol = breakdownCols[0];
    // Resolve metrics
    const metricList = ensureIsArray(metrics).map(m => (typeof m === 'object' && m !== null ? m.label || m.metric_name : String(m)));
    const primaryMetric = metricList[0] || 'value';
    const targetMetricKey = typeof target_metric === 'object' && target_metric !== null
        ? target_metric.label || target_metric.metric_name
        : target_metric ? String(target_metric) : undefined;
    const formatter = getNumberFormatter(numberFormat);
    // Palette resolution
    let palette = DEFAULT_COLORS;
    if (color_scheme) {
        try {
            const scale = CategoricalColorNamespace.getScale(color_scheme);
            if (scale && typeof scale.colors === 'object' && Array.isArray(scale.colors)) {
                palette = scale.colors;
            }
        }
        catch {
            // Fallback to default
        }
    }
    // 1. Collect unique ordered categories
    const categoriesSet = new Set();
    data.forEach(row => {
        const val = row[resolvedXAxis];
        categoriesSet.add(val !== null && val !== undefined ? String(val) : 'N/D');
    });
    const categories = Array.from(categoriesSet);
    // 2. Build Series based on whether breakdown dimension is present
    const series = [];
    if (breakdownCol) {
        // Breakdown by group dimension (e.g. REGIME = 'Convenzionato', 'Privato')
        const groupValuesSet = new Set();
        data.forEach(row => {
            const gVal = row[breakdownCol];
            groupValuesSet.add(gVal !== null && gVal !== undefined ? String(gVal) : 'N/D');
        });
        const groupValues = Array.from(groupValuesSet);
        // Map: groupVal -> (cat -> record)
        const lookup = new Map();
        data.forEach(row => {
            const cat = row[resolvedXAxis] !== null && row[resolvedXAxis] !== undefined ? String(row[resolvedXAxis]) : 'N/D';
            const gVal = row[breakdownCol] !== null && row[breakdownCol] !== undefined ? String(row[breakdownCol]) : 'N/D';
            if (!lookup.has(gVal)) {
                lookup.set(gVal, new Map());
            }
            lookup.get(gVal).set(cat, row);
        });
        groupValues.forEach((gVal, sIdx) => {
            const gMap = lookup.get(gVal) || new Map();
            const seriesData = [];
            const seriesItems = [];
            categories.forEach(cat => {
                const row = gMap.get(cat);
                const rawVal = row ? row[primaryMetric] : null;
                const numVal = typeof rawVal === 'number' ? rawVal : rawVal !== null && !isNaN(Number(rawVal)) ? Number(rawVal) : null;
                seriesData.push(numVal);
                const targetVal = targetMetricKey && row ? Number(row[targetMetricKey]) || null : null;
                seriesItems.push({
                    category: cat,
                    value: numVal,
                    formattedValue: numVal !== null ? formatter(numVal) : undefined,
                    targetValue: targetVal,
                    rawData: row,
                });
            });
            series.push({
                name: gVal,
                key: gVal,
                color: palette[sIdx % palette.length],
                data: seriesData,
                items: seriesItems,
            });
        });
    }
    else if (metricList.length > 1) {
        // Multiple metrics (e.g., Target vs Actual)
        metricList.forEach((mKey, mIdx) => {
            const seriesData = [];
            const seriesItems = [];
            categories.forEach(cat => {
                const row = data.find(r => String(r[resolvedXAxis]) === cat);
                const rawVal = row ? row[mKey] : null;
                const numVal = typeof rawVal === 'number' ? rawVal : rawVal !== null && !isNaN(Number(rawVal)) ? Number(rawVal) : null;
                seriesData.push(numVal);
                seriesItems.push({
                    category: cat,
                    value: numVal,
                    formattedValue: numVal !== null ? formatter(numVal) : undefined,
                    rawData: row,
                });
            });
            series.push({
                name: mKey,
                key: mKey,
                color: palette[mIdx % palette.length],
                data: seriesData,
                items: seriesItems,
            });
        });
    }
    else {
        // Single metric, single dimension
        const seriesData = [];
        const seriesItems = [];
        categories.forEach(cat => {
            const row = data.find(r => String(r[resolvedXAxis]) === cat);
            const rawVal = row ? row[primaryMetric] : null;
            const numVal = typeof rawVal === 'number' ? rawVal : rawVal !== null && !isNaN(Number(rawVal)) ? Number(rawVal) : null;
            seriesData.push(numVal);
            const targetVal = targetMetricKey && row ? Number(row[targetMetricKey]) || null : null;
            seriesItems.push({
                category: cat,
                value: numVal,
                formattedValue: numVal !== null ? formatter(numVal) : undefined,
                targetValue: targetVal,
                rawData: row,
            });
        });
        series.push({
            name: primaryMetric,
            key: primaryMetric,
            color: palette[0],
            data: seriesData,
            items: seriesItems,
        });
    }
    // 3. Compute Benchmark if enabled
    let benchmark;
    if (showBenchmark) {
        let resolvedBenchmarkVal = Number(benchmarkValue) || 0;
        let bLabel = `Benchmark (${formatter(resolvedBenchmarkVal)})`;
        if (benchmarkType === 'average') {
            const allVals = [];
            series.forEach(s => {
                s.data.forEach(v => {
                    if (typeof v === 'number')
                        allVals.push(v);
                });
            });
            if (allVals.length > 0) {
                resolvedBenchmarkVal = allVals.reduce((a, b) => a + b, 0) / allVals.length;
                bLabel = `Media (${formatter(resolvedBenchmarkVal)})`;
            }
        }
        else if (benchmarkType === 'median') {
            const allVals = [];
            series.forEach(s => {
                s.data.forEach(v => {
                    if (typeof v === 'number')
                        allVals.push(v);
                });
            });
            if (allVals.length > 0) {
                allVals.sort((a, b) => a - b);
                const mid = Math.floor(allVals.length / 2);
                resolvedBenchmarkVal = allVals.length % 2 !== 0 ? allVals[mid] : (allVals[mid - 1] + allVals[mid]) / 2;
                bLabel = `Mediana (${formatter(resolvedBenchmarkVal)})`;
            }
        }
        benchmark = {
            value: resolvedBenchmarkVal,
            label: bLabel,
        };
        // Calculate delta % for each item against benchmark if not set by targetMetric
        series.forEach(s => {
            s.items.forEach(item => {
                const target = item.targetValue !== undefined && item.targetValue !== null ? item.targetValue : benchmark?.value;
                if (item.value !== null && target && target !== 0) {
                    const delta = ((item.value - target) / target) * 100;
                    item.deltaPercent = Math.round(delta * 10) / 10;
                }
            });
        });
    }
    // 4. Cross-filtering hook
    const { setDataMask, onAddFilter } = (hooks || {});
    const onCrossFilter = (category, seriesName) => {
        if (!emit_filter)
            return;
        if (typeof setDataMask === 'function') {
            setDataMask({
                extraFormData: {
                    filters: [
                        {
                            col: resolvedXAxis,
                            op: 'IN',
                            val: [category],
                        },
                    ],
                },
                filterState: {
                    value: [category],
                    label: category,
                },
            });
        }
        else if (typeof onAddFilter === 'function') {
            onAddFilter({
                col: resolvedXAxis,
                op: 'IN',
                val: [category],
            });
        }
    };
    return {
        width,
        height,
        categories,
        series,
        benchmark,
        viewMode,
        orientation,
        stacking,
        barShape3D,
        depth3D,
        tilt3D,
        shadow3D,
        barBorderRadius,
        showTrackBackground,
        showBenchmark,
        showDeltaBadge,
        deltaPolarity,
        showValue,
        valuePosition,
        numberFormat,
        colorScheme: palette,
        showLegend: show_legend,
        legendOrientation,
        emitFilter: emit_filter,
        enableToolbar,
        xAxisTitle: x_axis_title,
        yAxisTitle: y_axis_title,
        formData: fd,
        onCrossFilter,
    };
}
//# sourceMappingURL=transformProps.js.map