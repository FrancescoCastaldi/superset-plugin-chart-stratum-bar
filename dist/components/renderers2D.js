export function get2DBarOption(props) {
    const { categories, series, benchmark, orientation, stacking, barBorderRadius, showTrackBackground, showBenchmark, showValue, valuePosition, colorScheme, showLegend, legendOrientation, xAxisTitle, yAxisTitle, hasDualYAxis, yAxis2Title, yAxis2Format, secondaryAreaGradient = true, secondaryLineWidth = 3, secondaryLineColor = '#ea580c', themeMode = 'light', enableA11yDecal = false, } = props;
    const isDark = themeMode === 'dark';
    const isVertical = orientation === 'vertical';
    // Helper convert hex to rgba
    const hexToRgba = (hex, alpha) => {
        if (!hex || !hex.startsWith('#'))
            return `rgba(234, 88, 12, ${alpha})`;
        const h = hex.replace('#', '');
        const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
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
            color: isDark ? '#cbd5e1' : '#4b5563',
            fontSize: 12,
            interval: 0,
            rotate: categories.some(c => c.length > 12) && isVertical ? 25 : 0,
        },
        axisLine: { lineStyle: { color: isDark ? '#334155' : '#d1d5db' } },
        axisTick: { show: false },
        name: isVertical ? xAxisTitle : yAxisTitle,
        nameLocation: 'end',
        nameTextStyle: { color: isDark ? '#94a3b8' : '#6b7280', fontSize: 12, padding: [0, 0, 0, 8] },
    };
    // Value Axis (Primary)
    const valueAxis = {
        type: 'value',
        axisLabel: {
            color: isDark ? '#94a3b8' : '#6b7280',
            fontSize: 11,
            formatter: (val) => {
                if (Math.abs(val) >= 1_000_000)
                    return (val / 1_000_000).toFixed(1) + 'M';
                if (Math.abs(val) >= 1_000)
                    return (val / 1_000).toFixed(1) + 'k';
                return String(val);
            },
        },
        splitLine: { lineStyle: { color: isDark ? '#1e293b' : '#f3f4f6', type: 'dashed' } },
        name: isVertical ? yAxisTitle : xAxisTitle,
        nameTextStyle: { color: isDark ? '#94a3b8' : '#6b7280', fontSize: 12, padding: [0, 8, 0, 0] },
    };
    // Secondary Value Axis (Right Y-Axis - Color-coded)
    const secondaryValueAxis = {
        type: 'value',
        position: isVertical ? 'right' : 'top',
        axisLabel: {
            color: secondaryLineColor,
            fontWeight: 600,
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
        nameTextStyle: { color: secondaryLineColor, fontWeight: 700, fontSize: 12, padding: [0, 0, 0, 8] },
    };
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
    // Tooltip configuration (Glassmorphism & Theme support)
    const tooltip = {
        trigger: 'axis',
        axisPointer: { type: 'cross', crossStyle: { color: isDark ? '#475569' : '#cbd5e1', width: 1, type: 'dashed' } },
        backgroundColor: isDark ? 'rgba(17, 24, 39, 0.94)' : 'rgba(255, 255, 255, 0.96)',
        borderColor: isDark ? '#374151' : '#e2e8f0',
        borderWidth: 1,
        padding: [12, 16],
        textStyle: { color: isDark ? '#f8fafc' : '#1f2937', fontSize: 13 },
        extraCssText: isDark
            ? 'backdrop-filter: blur(8px); box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.5); border-radius: 10px;'
            : 'backdrop-filter: blur(8px); box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.12); border-radius: 10px;',
        formatter: (params) => {
            if (!Array.isArray(params) || params.length === 0)
                return '';
            const cat = params[0].axisValueLabel;
            let html = `<div style="font-weight: 700; margin-bottom: 8px; color: ${isDark ? '#f8fafc' : '#111827'}; font-size: 14px;">${cat}</div>`;
            params.forEach((it) => {
                if (it.seriesName === '__track_bg__')
                    return;
                const color = it.color && typeof it.color === 'string' ? it.color : (it.color?.colorStops?.[0]?.color || '#3b82f6');
                const val = it.value;
                const isSec = it.seriesName === yAxis2Title || it.seriesIndex === series.length - 1 && hasDualYAxis;
                const formatted = yAxis2Format === '.2%' && isSec && typeof val === 'number'
                    ? `${(val * 100).toFixed(1)}%`
                    : (typeof val === 'number' ? val.toLocaleString('it-IT') : (val !== null && val !== undefined ? String(val) : 'N/D'));
                html += `
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 18px; margin: 4px 0; font-size: 12px;">
            <span style="display: flex; align-items: center; gap: 7px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: ${it.seriesType === 'line' ? '50%' : '2px'}; background: ${color};"></span>
              <span style="font-weight: 500;">${it.seriesName}</span>
            </span>
            <span style="font-weight: 700; font-variant-numeric: tabular-nums; color: ${isSec ? secondaryLineColor : 'inherit'};">${formatted}</span>
          </div>
        `;
                if (showBenchmark && benchmark && typeof benchmark.value === 'number' && typeof val === 'number' && it.seriesIndex === 0) {
                    const delta = val - benchmark.value;
                    const deltaPct = benchmark.value !== 0 ? (delta / benchmark.value) * 100 : 0;
                    const isPositive = delta >= 0;
                    const badgeColor = isPositive ? '#10b981' : '#ef4444';
                    const sign = isPositive ? '+' : '';
                    html += `
            <div style="font-size: 11px; color: ${badgeColor}; text-align: right; margin-top: 2px;">
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
        textStyle: { color: isDark ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 500 },
    };
    const rightPadding = hasDualYAxis ? 70 : 36;
    return {
        backgroundColor: 'transparent',
        animationDuration: 600,
        aria: { enabled: true, decal: { show: enableA11yDecal } },
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