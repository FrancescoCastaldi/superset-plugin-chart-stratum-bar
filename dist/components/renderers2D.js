export function get2DBarOption(props) {
    const { categories, series, benchmark, orientation, stacking, barBorderRadius, showTrackBackground, showBenchmark, showValue, valuePosition, colorScheme, showLegend, legendOrientation, xAxisTitle, yAxisTitle, } = props;
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
    // Value Axis
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
        const baseColor = colorScheme[idx % colorScheme.length] || '#2563eb';
        // Gradient stop
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
            stack: stacking !== 'none' ? 'stratum_stack' : undefined,
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
        // Benchmark line on the first series
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
    // Tooltip
    const tooltip = {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(17, 24, 39, 0.94)',
        borderColor: '#374151',
        borderWidth: 1,
        padding: [10, 14],
        textStyle: { color: '#f9fafb', fontSize: 12 },
        formatter: (params) => {
            const items = Array.isArray(params) ? params : [params];
            const validItems = items.filter(it => it.seriesName !== '__track_bg__');
            if (validItems.length === 0)
                return '';
            const catName = validItems[0].axisValueLabel || validItems[0].name;
            let html = `<div style="font-weight: 700; margin-bottom: 6px; font-size: 13px; border-bottom: 1px solid #374151; padding-bottom: 4px;">${catName}</div>`;
            validItems.forEach(it => {
                const val = it.value;
                const formatted = typeof val === 'number' ? val.toLocaleString('it-IT') : String(val ?? '-');
                const color = it.color?.colorStops?.[0]?.color || it.color || '#3b82f6';
                html += `
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; margin: 3px 0;">
            <span style="display: flex; align-items: center; gap: 6px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: ${color};"></span>
              <span>${it.seriesName}</span>
            </span>
            <span style="font-weight: 700; font-variant-numeric: tabular-nums;">${formatted}</span>
          </div>
        `;
                if (showBenchmark && benchmark && typeof benchmark.value === 'number' && typeof val === 'number') {
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
    return {
        animationDuration: 600,
        grid: {
            top: legendOrientation === 'top' ? 44 : 32,
            bottom: legendOrientation === 'bottom' ? 44 : 36,
            left: isVertical ? 60 : 100,
            right: 36,
            containLabel: true,
        },
        tooltip,
        legend,
        xAxis: isVertical ? categoryAxis : valueAxis,
        yAxis: isVertical ? valueAxis : categoryAxis,
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