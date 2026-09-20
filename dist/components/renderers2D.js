export function get2DBarOption(props) {
    const { categories, series, benchmark, orientation, stacking, barBorderRadius, showTrackBackground, showBenchmark, showValue, valuePosition, colorScheme, showLegend, legendOrientation, xAxisTitle, yAxisTitle, hasDualYAxis, yAxis2Title, yAxis2Format, } = props;
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
    const categoryAxis = {
        type: 'category',
        data: categories,
        axisLabel: {
            color: '#4b5563',
            fontSize: 12,
            interval: 0,
            rotate: categories.some(c => c.length > 12) && isVertical ? 25 : 0,
        },
        axisLine: { lineStyle: { color: '#d1d5db' } },
        axisTick: { show: false },
        name: isVertical ? xAxisTitle : yAxisTitle,
        nameLocation: 'end',
        nameTextStyle: { color: '#6b7280', fontSize: 12, padding: [0, 0, 0, 8] },
    };
    // Value Axis (Primary)
    const valueAxis = {
        type: 'value',
        axisLabel: {
            color: '#6b7280',
            fontSize: 11,
            formatter: (val) => {
                if (Math.abs(val) >= 1_000_000)
                    return (val / 1_000_000).toFixed(1) + 'M';
                if (Math.abs(val) >= 1_000)
                    return (val / 1_000).toFixed(1) + 'k';
                return String(val);
            },
        },
        splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
        name: isVertical ? yAxisTitle : xAxisTitle,
        nameTextStyle: { color: '#6b7280', fontSize: 12, padding: [0, 8, 0, 0] },
    };
    // Secondary Value Axis (Right Y-Axis)
    const secondaryValueAxis = {
        type: 'value',
        position: isVertical ? 'right' : 'top',
        axisLabel: {
            color: '#9a3412',
            fontSize: 11,
            formatter: (val) => {
                if (yAxis2Format === '.2%') {
                    return `${(val * 100).toFixed(1)}%`;
                }
                if (Math.abs(val) >= 1_000_000)
                    return (val / 1_000_000).toFixed(1) + 'M';
                if (Math.abs(val) >= 1_000)
                    return (val / 1_000).toFixed(1) + 'k';
                return Number(val.toFixed(2)).toLocaleString('it-IT');
            },
        },
        splitLine: { show: false }, // Avoid grid clash with primary axis
        name: yAxis2Title || '',
        nameTextStyle: { color: '#9a3412', fontSize: 12, padding: [0, 0, 0, 8] },
    };
    const echartsSeries = [];
    // Optional Track background
    if (showTrackBackground && stacking === 'none') {
        echartsSeries.push({
            name: '__track_bg__',
            type: 'bar',
            silent: true,
            itemStyle: {
                color: 'rgba(229, 231, 235, 0.45)',
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
            // Line Series for Secondary Axis or Trend
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
                    width: 3,
                    color: baseColor,
                    shadowColor: 'rgba(0, 0, 0, 0.15)',
                    shadowBlur: 4,
                },
                itemStyle: {
                    color: baseColor,
                    borderColor: '#ffffff',
                    borderWidth: 2,
                },
                emphasis: {
                    scale: true,
                    itemStyle: {
                        borderWidth: 3,
                        shadowBlur: 8,
                        shadowColor: 'rgba(0,0,0,0.3)',
                    },
                },
                label: {
                    show: showValue,
                    position: 'top',
                    color: baseColor,
                    fontWeight: 600,
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
        const seriesItem = {
            name: s.name,
            type: 'bar',
            stack: stacking !== 'none' && !isSecondary ? 'stratum_stack' : undefined,
            yAxisIndex: isVertical ? (s.yAxisIndex ?? 0) : 0,
            xAxisIndex: !isVertical ? (s.yAxisIndex ?? 0) : 0,
            data: s.data,
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
                position: valuePosition === 'inside' ? 'inside' : isVertical ? 'top' : 'right',
                color: valuePosition === 'inside' ? '#ffffff' : '#374151',
                fontWeight: 600,
                fontSize: 11,
                formatter: (params) => {
                    const val = params.value;
                    if (val === null || val === undefined)
                        return '';
                    if (typeof val === 'number') {
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
    // Tooltip configuration
    const tooltip = {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: [10, 14],
        textStyle: { color: '#1f2937', fontSize: 13 },
        extraCssText: 'box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); border-radius: 8px;',
        formatter: (params) => {
            if (!Array.isArray(params) || params.length === 0)
                return '';
            const cat = params[0].axisValueLabel;
            let html = `<div style="font-weight: 700; margin-bottom: 8px; color: #111827;">${cat}</div>`;
            params.forEach((it) => {
                if (it.seriesName === '__track_bg__')
                    return;
                const color = it.color && typeof it.color === 'string' ? it.color : (it.color?.colorStops?.[0]?.color || '#3b82f6');
                const val = it.value;
                const formatted = typeof val === 'number' ? val.toLocaleString('it-IT') : (val !== null && val !== undefined ? String(val) : 'N/D');
                html += `
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; margin: 3px 0; font-size: 12px;">
            <span style="display: flex; align-items: center; gap: 6px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: ${color};"></span>
              <span>${it.seriesName}</span>
            </span>
            <span style="font-weight: 700; font-variant-numeric: tabular-nums;">${formatted}</span>
          </div>
        `;
                if (showBenchmark && benchmark && typeof benchmark.value === 'number' && typeof val === 'number' && it.seriesIndex === 0) {
                    const delta = val - benchmark.value;
                    const deltaPct = benchmark.value !== 0 ? (delta / benchmark.value) * 100 : 0;
                    const isPositive = delta >= 0;
                    const badgeColor = isPositive ? '#10b981' : '#ef4444';
                    const sign = isPositive ? '+' : '';
                    html += `
            <div style="font-size: 11px; color: ${badgeColor}; text-align: right; margin-top: 1px;">
              vs Target: <strong>${sign}${deltaPct.toFixed(1)}%</strong> (${sign}${delta.toLocaleString('it-IT')})
            </div>
          `;
                }
            });
            return html;
        },
    };
    // Legend
    const legend = {
        show: showLegend && series.length > 1,
        orient: legendOrientation === 'left' || legendOrientation === 'right' ? 'vertical' : 'horizontal',
        top: legendOrientation === 'top' ? 8 : legendOrientation === 'bottom' ? 'bottom' : 'middle',
        left: legendOrientation === 'left' ? 8 : legendOrientation === 'right' ? 'right' : 'center',
        textStyle: { color: '#374151', fontSize: 12 },
    };
    const rightPadding = hasDualYAxis ? 65 : 36;
    return {
        animationDuration: 600,
        grid: {
            top: legendOrientation === 'top' ? 44 : 32,
            bottom: legendOrientation === 'bottom' ? 44 : 36,
            left: isVertical ? 60 : 100,
            right: rightPadding,
            containLabel: true,
        },
        tooltip,
        legend,
        xAxis: isVertical ? categoryAxis : hasDualYAxis ? [valueAxis, secondaryValueAxis] : valueAxis,
        yAxis: isVertical ? (hasDualYAxis ? [valueAxis, secondaryValueAxis] : valueAxis) : categoryAxis,
        series: echartsSeries,
    };
}
function adjustColorBrightness(hex, percent) {
    if (!hex || !hex.startsWith('#'))
        return hex;
    let num = parseInt(hex.replace('#', ''), 16);
    if (isNaN(num))
        return hex;
    let r = (num >> 16) + Math.round(255 * (percent / 100));
    let g = ((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100));
    let b = (num & 0x0000ff) + Math.round(255 * (percent / 100));
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
//# sourceMappingURL=renderers2D.js.map