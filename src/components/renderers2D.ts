import { StratumBarTransformedProps } from '../types';
import { getCategoryAxisConfig, getValueAxisConfig, getSecondaryValueAxisConfig, getLegendConfig, getTooltipConfig, getGridConfig } from '../utils/echartsUtils';

import { adjustColorBrightness, hexToRgba } from '../utils/colors';

export function get2DBarOption(props: StratumBarTransformedProps) {
  const {
    categories,
    series,
    benchmark,
    orientation,
    stacking,
    barBorderRadius,
    showTrackBackground,
    showBenchmark,
    showValue,
    valuePosition,
    colorScheme,
    showLegend,
    legendOrientation,
    xAxisTitle,
    yAxisTitle,
    hasDualYAxis,
    yAxis2Title,
    yAxis2Format,
    secondaryAreaGradient = true,
    secondaryLineWidth = 3,
    secondaryLineColor = '#ea580c',
    themeMode = 'light',
    enableA11yDecal = false,
  } = props;

  const isDark = themeMode === 'dark';
  const isVertical = orientation === 'vertical';

  // Calculate max value for track background
  let maxVal = 0;
  for (const s of series) {
    for (const v of s.data) {
      if (typeof v === 'number' && v > maxVal) maxVal = v;
    }
  }
  if (benchmark && benchmark.value > maxVal) maxVal = benchmark.value;
  const trackMax = Math.ceil(maxVal * 1.15) || 100;

  // Category Axis
  const categoryAxis = getCategoryAxisConfig(categories, isVertical, isDark, isVertical ? xAxisTitle : yAxisTitle);

  // Value Axis (Primary)
  const valueAxis = getValueAxisConfig(isVertical, isDark, isVertical ? yAxisTitle : xAxisTitle);

  // Secondary Value Axis (Right Y-Axis - Color-coded)
  const secondaryValueAxis = getSecondaryValueAxisConfig(isVertical, secondaryLineColor, yAxis2Format, yAxis2Title);

  const echartsSeries: any[] = [];

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
      const lineSeriesItem: any = {
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
          formatter: (params: any) => {
            const val = params.value;
            if (val === null || val === undefined) return '';
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
      type: 'linear' as const,
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
        props.selectedValues!.includes(catName) ||
        props.selectedValues!.includes(s.name) ||
        props.selectedValues!.includes(`${catName} · ${s.name}`);
      return {
        value: val,
        name: catName,
        itemStyle: {
          opacity: isSelected ? 1.0 : 0.28,
        },
      };
    });

    const seriesItem: any = {
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
        formatter: (params: any) => {
          const val = params.value;
          if (val === null || val === undefined) return '';
          if (typeof val === 'number') {
            // In stacked mode suppress near-zero labels (< 1% of max) to avoid clutter
            if (stacking !== 'none' && maxVal > 0 && Math.abs(val) / maxVal < 0.015) return '';
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
    trigger: 'axis' as const,
    axisPointer: { type: 'cross' as const, crossStyle: { color: isDark ? '#475569' : '#cbd5e1', width: 1, type: 'dashed' as const } },
    backgroundColor: isDark ? 'rgba(17, 24, 39, 0.94)' : 'rgba(255, 255, 255, 0.96)',
    borderColor: isDark ? '#374151' : '#e2e8f0',
    borderWidth: 1,
    padding: [12, 16],
    textStyle: { color: isDark ? '#f8fafc' : '#1f2937', fontSize: 13 },
    extraCssText: isDark
      ? 'backdrop-filter: blur(8px); box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.5); border-radius: 10px;'
      : 'backdrop-filter: blur(8px); box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.12); border-radius: 10px;',
    formatter: (params: any) => {
      if (!Array.isArray(params) || params.length === 0) return '';
      const cat = params[0].axisValueLabel;
      let html = `<div style="font-weight: 700; margin-bottom: 8px; color: ${isDark ? '#f8fafc' : '#111827'}; font-size: 14px;">${cat}</div>`;

      params.forEach((it: any) => {
        if (it.seriesName === '__track_bg__') return;
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
