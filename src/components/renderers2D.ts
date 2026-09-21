import { StratumBarTransformedProps } from '../types';
import { getCategoryAxisConfig, getValueAxisConfig, getSecondaryValueAxisConfig, getLegendConfig, getTooltipConfig, getGridConfig, getTooltipFormatter } from '../utils/echartsUtils';
import { calculateAxisBreak, transformValueForAxisBreak } from '../utils/axisBreakUtils';

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
    enableAxisBreak = false,
    axisBreakMode = 'auto',
    axisBreakThreshold,
  } = props;

  const isDark = themeMode === 'dark';
  const isVertical = orientation === 'vertical';
  const isStacked = stacking !== 'none';

  // Calculate Axis Break / Outlier Pinning
  const axisBreak = calculateAxisBreak(series, isStacked, categories.length, {
    enabled: enableAxisBreak,
    mode: axisBreakMode,
    threshold: axisBreakThreshold,
  });

  // Calculate max value for track background and primary axis
  let maxVal = 0;
  for (const s of series) {
    if (s.yAxisIndex === 1) continue;
    for (const v of s.data) {
      if (typeof v === 'number' && v > maxVal) maxVal = v;
    }
  }
  if (benchmark && benchmark.value > maxVal) maxVal = benchmark.value;

  const effectiveMaxVal = axisBreak.enabled ? axisBreak.displayMax : maxVal;
  const trackMax = Math.ceil(effectiveMaxVal * 1.15) || 100;

  // Category Axis
  const categoryAxis = getCategoryAxisConfig(categories, isVertical, isDark, isVertical ? xAxisTitle : yAxisTitle);

  // Value Axis (Primary) - pass effective max so outlier zone or standard scale has proper limit
  const valueAxis = getValueAxisConfig(
    isVertical,
    isDark,
    isVertical ? yAxisTitle : xAxisTitle,
    axisBreak.enabled ? axisBreak.displayMax : undefined
  );

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

      // Apply axis break transform if enabled
      const { visualVal, isCapped, originalVal } = axisBreak.enabled && !isSecondary
        ? transformValueForAxisBreak(val, axisBreak)
        : { visualVal: val, isCapped: false, originalVal: val };

      return {
        value: visualVal,
        originalVal: originalVal,
        isCapped: isCapped,
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
        position: valuePosition === 'inside'
          ? 'inside'
          : (stacking !== 'none'
            ? 'inside'
            : (isVertical ? 'top' : 'right')),
        rotate: valuePosition === 'slanted' ? (isVertical ? 45 : -35) : 0,
        align: valuePosition === 'slanted'
          ? 'left'
          : (valuePosition === 'inside' ? 'center' : (isVertical ? 'center' : 'left')),
        verticalAlign: valuePosition === 'slanted'
          ? 'middle'
          : (valuePosition === 'inside' ? 'middle' : (isVertical ? 'bottom' : 'middle')),
        distance: valuePosition === 'slanted' ? 8 : (valuePosition === 'inside' ? 0 : 5),
        color: (stacking !== 'none' || valuePosition === 'inside')
          ? '#ffffff'
          : (isDark ? '#f8fafc' : '#1f2937'),
        textBorderColor: (stacking !== 'none' || valuePosition === 'inside')
          ? 'rgba(0, 0, 0, 0.75)'
          : (isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.9)'),
        textBorderWidth: (stacking !== 'none' || valuePosition === 'inside') ? 2.5 : 1.5,
        fontWeight: 600,
        fontSize: 11,
        // Hide label for very small segments to avoid overlap
        minMargin: 4,
        formatter: (params: any) => {
          const rawItem = params.data;
          const isCapped = rawItem?.isCapped;
          const realVal = rawItem?.originalVal !== undefined ? rawItem.originalVal : params.value;
          if (realVal === null || realVal === undefined) return '';
          if (typeof realVal === 'number') {
            // In stacked mode suppress near-zero labels (< 1.5% of max) to avoid clutter
            if (stacking !== 'none' && effectiveMaxVal > 0 && Math.abs(realVal) / effectiveMaxVal < 0.015) return '';
            const formatted = realVal.toLocaleString('it-IT');
            return isCapped ? `// ${formatted}` : formatted;
          }
          return isCapped ? `// ${String(realVal)}` : String(realVal);
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
  const tooltipFormatter = getTooltipFormatter(categories, isDark, colorScheme, showBenchmark, benchmark, yAxis2Title, yAxis2Format, hasDualYAxis ? secondaryLineColor : undefined, false, isVertical);
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
