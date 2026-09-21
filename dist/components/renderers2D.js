import { getCategoryAxisConfig, getValueAxisConfig, getSecondaryValueAxisConfig, getLegendConfig, getTooltipConfig, getGridConfig, getTooltipFormatter } from '../utils/echartsUtils';
import { adjustColorBrightness, hexToRgba } from '../utils/colors';
export function get2DBarOption(props) {
    const { categories, series, benchmark, orientation, stacking, barBorderRadius, showTrackBackground, showBenchmark, showValue, valuePosition, colorScheme, showLegend, legendOrientation, xAxisTitle, yAxisTitle, hasDualYAxis, yAxis2Title, yAxis2Format, secondaryAreaGradient = true, secondaryLineWidth = 3, secondaryLineColor = '#ea580c', themeMode = 'light', enableA11yDecal = false, } = props;
    const isDark = themeMode === 'dark';
    const isVertical = orientation === 'vertical';
    // Calculate max value for track background
    let maxVal = 0;
    for (const s of series) {
        for (const v of s.data) {
            if (typeof v === 'number' && v > maxVal)
                maxVal = v;
        }
    }
    if (benchmark && benchmark.value > maxVal)
        maxVal = benchmark.value;
    const trackMax = Math.ceil(maxVal * 1.15) || 100;
    // Category Axis
    const categoryAxis = getCategoryAxisConfig(categories, isVertical, isDark, isVertical ? xAxisTitle : yAxisTitle);
    // Value Axis (Primary)
    const valueAxis = getValueAxisConfig(isVertical, isDark, isVertical ? yAxisTitle : xAxisTitle);
    // Secondary Value Axis (Right Y-Axis - Color-coded)
    const secondaryValueAxis = getSecondaryValueAxisConfig(isVertical, secondaryLineColor, yAxis2Format, yAxis2Title);
    const echartsSeries = [];
    // Optional Track background
    if (showTrackBackground && stacking === 'none') {
        echartsSeries.push({
            name: '__track_bg__',
            type: 'bar',
            silent: true,
            itemStyle: {
                color: isDark ? 'rgba(51, 65, 85, 0.35)' : 'rgba(229, 231, 235, 0.45)',
                borderRadius: isVertical
                    ? [barBorderRadius, barBorderRadius, 0, 0]
                    : [0, barBorderRadius, barBorderRadius, 0],
            },
            barGap: '-100%',
            data: categories.map(() => trackMax),
            z: 1,
        });
    }
    // Data Series
    series.forEach((s, idx) => {
        const isSecondary = s.yAxisIndex === 1;
        const isLine = s.seriesType === 'line';
        const baseColor = s.color || colorScheme[idx % colorScheme.length] || '#2563eb';
        if (isLine) {
            // Line Series with optional Area Gradient
            const lineSeriesItem = {
                name: s.name,
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 8,
                yAxisIndex: isVertical ? (s.yAxisIndex ?? 0) : 0,
                xAxisIndex: !isVertical ? (s.yAxisIndex ?? 0) : 0,
                data: s.data,
                lineStyle: {
                    width: secondaryLineWidth,
                    color: baseColor,
                    shadowColor: hexToRgba(baseColor, 0.35),
                    shadowBlur: 8,
                    shadowOffsetY: 3,
                },
                itemStyle: {
                    color: baseColor,
                    borderColor: isDark ? '#111827' : '#ffffff',
                    borderWidth: 2.5,
                },
                emphasis: {
                    scale: true,
                    itemStyle: {
                        borderWidth: 3,
                        shadowBlur: 10,
                        shadowColor: hexToRgba(baseColor, 0.6),
                    },
                },
                label: {
                    show: showValue,
                    position: 'top',
                    color: baseColor,
                    fontWeight: 700,
                    fontSize: 11,
                    formatter: (params) => {
                        const val = params.value;
                        if (val === null || val === undefined)
                            return '';
                        if (yAxis2Format === '.2%') {
                            return `${(Number(val) * 100).toFixed(1)}%`;
                        }
                        return typeof val === 'number' ? val.toLocaleString('it-IT') : String(val);
                    },
                },
                z: 10,
            };
            if (secondaryAreaGradient) {
                lineSeriesItem.areaStyle = {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: hexToRgba(baseColor, 0.25) },
                            { offset: 1, color: hexToRgba(baseColor, 0.0) },
                        ],
                    },
                };
            }
            echartsSeries.push(lineSeriesItem);
            return;
        }
        // Gradient stop for bar
        const gradientColor = {
            type: 'linear',
            x: 0,
            y: 0,
            x2: isVertical ? 0 : 1,
            y2: isVertical ? 1 : 0,
            colorStops: [
                { offset: 0, color: baseColor },
                { offset: 1, color: adjustColorBrightness(baseColor, -20) },
            ],
        };
        const hasSelection = Boolean(props.selectedValues && props.selectedValues.length > 0);
        const barData = s.data.map((val, catIdx) => {
            const catName = categories[catIdx] || '';
            const isSelected = !hasSelection ||
                props.selectedValues.includes(catName) ||
                props.selectedValues.includes(s.name) ||
                props.selectedValues.includes(`${catName} · ${s.name}`);
            return {
                value: val,
                name: catName,
                itemStyle: {
                    opacity: isSelected ? 1.0 : 0.28,
                },
            };
        });
        const seriesItem = {
            name: s.name,
            type: 'bar',
            stack: stacking !== 'none' && !isSecondary ? 'stratum_stack' : undefined,
            yAxisIndex: isVertical ? (s.yAxisIndex ?? 0) : 0,
            xAxisIndex: !isVertical ? (s.yAxisIndex ?? 0) : 0,
            data: barData,
            itemStyle: {
                color: gradientColor,
                borderRadius: isVertical
                    ? [barBorderRadius, barBorderRadius, 0, 0]
                    : [0, barBorderRadius, barBorderRadius, 0],
                shadowColor: 'rgba(0, 0, 0, 0.08)',
                shadowBlur: 6,
                shadowOffsetY: 2,
            },
            emphasis: {
                itemStyle: {
                    shadowColor: 'rgba(0, 0, 0, 0.22)',
                    shadowBlur: 10,
                },
            },
            label: {
                show: showValue,
                // In stacked mode labels must go inside the segment; top-only label works for the last series
                position: stacking !== 'none'
                    ? 'inside'
                    : (valuePosition === 'inside' ? 'inside' : isVertical ? 'top' : 'right'),
                color: (stacking !== 'none' || valuePosition === 'inside') ? '#ffffff' : '#374151',
                fontWeight: 600,
                fontSize: 11,
                // Hide label for very small segments to avoid overlap
                minMargin: 4,
                formatter: (params) => {
                    const val = params.value;
                    if (val === null || val === undefined)
                        return '';
                    if (typeof val === 'number') {
                        // In stacked mode suppress near-zero labels (< 1% of max) to avoid clutter
                        if (stacking !== 'none' && maxVal > 0 && Math.abs(val) / maxVal < 0.015)
                            return '';
                        return val.toLocaleString('it-IT');
                    }
                    return String(val);
                },
            },
            z: 2,
        };
        // Benchmark line on the first primary series
        if (idx === 0 && showBenchmark && benchmark && typeof benchmark.value === 'number') {
            seriesItem.markLine = {
                symbol: ['none', 'none'],
                silent: false,
                lineStyle: {
                    color: '#ef4444',
                    type: 'dashed',
                    width: 2,
                },
                label: {
                    position: isVertical ? 'end' : 'start',
                    formatter: `${benchmark.label}: ${benchmark.value.toLocaleString('it-IT')}`,
                    color: '#dc2626',
                    fontSize: 11,
                    fontWeight: 700,
                    backgroundColor: 'rgba(254, 242, 242, 0.92)',
                    borderColor: '#fca5a5',
                    borderWidth: 1,
                    borderRadius: 4,
                    padding: [3, 6],
                },
                data: [
                    isVertical
                        ? { yAxis: benchmark.value }
                        : { xAxis: benchmark.value },
                ],
            };
        }
        echartsSeries.push(seriesItem);
    });
    // Tooltip configuration (Glassmorphism & Theme support)
    const tooltipFormatter = getTooltipFormatter(categories, isDark, colorScheme, showBenchmark, benchmark, yAxis2Title, yAxis2Format, hasDualYAxis ? secondaryLineColor : undefined, false);
    const tooltip = getTooltipConfig(isDark, tooltipFormatter);
    // Legend — with explicit per-series colors so the legend swatches match the bars
    const legend = getLegendConfig(series, colorScheme, showLegend || false, legendOrientation || 'top', isDark);
    // Adaptive right padding: horizontal needs more room for value labels outside bars
    return {
        backgroundColor: 'transparent',
        animationDuration: 600,
        aria: { enabled: true, decal: { show: enableA11yDecal } },
        grid: getGridConfig(isVertical, hasDualYAxis || false, legendOrientation || 'top'),
        tooltip,
        legend,
        xAxis: isVertical ? categoryAxis : hasDualYAxis ? [valueAxis, secondaryValueAxis] : valueAxis,
        yAxis: isVertical ? (hasDualYAxis ? [valueAxis, secondaryValueAxis] : valueAxis) : categoryAxis,
        series: echartsSeries,
    };
}
//# sourceMappingURL=renderers2D.js.map