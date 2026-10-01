import { StratumBarTransformedProps } from '../types';
import { getCategoryAxisConfig, getValueAxisConfig, getSecondaryValueAxisConfig, getLegendConfig, getTooltipConfig, getGridConfig, getTooltipFormatter } from '../utils/echartsUtils';
import { calculateAxisBreak, transformValueForAxisBreak } from '../utils/axisBreakUtils';
import { getNumberFormatter } from '@superset-ui/core';

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
    numberFormat,
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

  // Calculate max and min values for track background and primary axis
  let maxVal = 0;
  let minVal = 0;
  if (isStacked) {
    for (let c = 0; c < categories.length; c++) {
      let posSum = 0;
      let negSum = 0;
      for (const s of series) {
        if (s.yAxisIndex === 1) continue;
        const v = s.data[c];
        if (typeof v === 'number' && !isNaN(v)) {
          if (v > 0) posSum += v;
          else negSum += v;
        }
      }
      if (posSum > maxVal) maxVal = posSum;
      if (negSum < minVal) minVal = negSum;
    }
  } else {
    for (const s of series) {
      if (s.yAxisIndex === 1) continue;
      for (const v of s.data) {
        if (typeof v === 'number' && !isNaN(v)) {
          if (v > maxVal) maxVal = v;
          if (v < minVal) minVal = v;
        }
      }
    }
  }
  if (benchmark && benchmark.value > maxVal) maxVal = benchmark.value;
  if (benchmark && benchmark.value < minVal) minVal = benchmark.value;

  const effectiveMaxVal = axisBreak.enabled && axisBreak.hasOutliers ? axisBreak.displayMax : (maxVal > 0 ? maxVal : undefined);
  const effectiveMinVal = minVal < 0 ? minVal : undefined;
  const trackMax = Math.ceil((effectiveMaxVal || 100) * 1.15);

  // Category Axis
  const categoryAxis = getCategoryAxisConfig(categories, isVertical, isDark, isVertical ? xAxisTitle : yAxisTitle);

  // Value Axis (Primary) - pass effective max and min so outlier zone or standard scale has proper limit
  const valueAxis = getValueAxisConfig(
    isVertical,
    isDark,
    isVertical ? yAxisTitle : xAxisTitle,
    effectiveMaxVal,
    effectiveMinVal
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

      const isNegative = typeof visualVal === 'number' && visualVal < 0;
      const isSignedSeries = !isSecondary && stacking === 'none' && minVal < 0;
      const itemRadius = isVertical
        ? (isNegative ? [0, 0, barBorderRadius, barBorderRadius] : [barBorderRadius, barBorderRadius, 0, 0])
        : (isNegative ? [barBorderRadius, 0, 0, barBorderRadius] : [0, barBorderRadius, barBorderRadius, 0]);

      let itemColor = undefined;
      if (isSignedSeries && typeof visualVal === 'number') {
        const posColor = '#1e8e3e';
        const negColor = '#d93025';
        const targetColor = visualVal >= 0 ? posColor : negColor;
        itemColor = {
          type: 'linear' as const,
          x: 0,
          y: 0,
          x2: isVertical ? 0 : 1,
          y2: isVertical ? 1 : 0,
          colorStops: [
            { offset: 0, color: targetColor },
            { offset: 1, color: adjustColorBrightness(targetColor, -15) },
          ],
        };
      }

      return {
        value: visualVal,
        originalVal: originalVal,
        isCapped: isCapped,
        name: catName,
        itemStyle: {
          color: itemColor,
          borderRadius: itemRadius,
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
        position: (valuePosition === 'inside' || stacking !== 'none')
          ? 'inside'
          : (isVertical ? 'top' : 'right'),
        rotate: valuePosition === 'slanted' ? (isVertical ? 45 : -35) : 0,
        align: valuePosition === 'slanted'
          ? 'left'
          : (valuePosition === 'inside' ? 'center' : (isVertical ? 'center' : 'left')),
        verticalAlign: valuePosition === 'slanted'
          ? 'middle'
          : (valuePosition === 'inside' ? 'middle' : (isVertical ? 'bottom' : 'middle')),
        distance: valuePosition === 'slanted' ? 8 : (valuePosition === 'inside' ? 0 : 8),
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
            const max = effectiveMaxVal || 1;
            if (stacking !== 'none' && max > 0 && Math.abs(realVal) / max < 0.015) return '';
            let formatted = '';
            try {
              if (numberFormat) {
                formatted = getNumberFormatter(numberFormat)(realVal);
              } else {
                formatted = realVal.toLocaleString('it-IT');
              }
            } catch {
              formatted = realVal.toLocaleString('it-IT');
            }
            return isCapped ? `// ${formatted}` : formatted;
          }
          return isCapped ? `// ${String(realVal)}` : String(realVal);
        },
      },
      z: 2,
    };

    if (props.showSmartAnnotations) {
      seriesItem.markPoint = {
        symbol: 'pin',
        symbolSize: 40,
        label: {
          show: true,
          color: '#fff',
          fontWeight: 'bold',
          formatter: (params: any) => params.type === 'max' ? '🏆' : '📉',
          fontSize: 14,
        },
        itemStyle: {
          color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
          borderColor: baseColor,
          borderWidth: 2,
          shadowBlur: 6,
          shadowColor: 'rgba(0,0,0,0.2)',
        },
        data: [
          { type: 'max', name: 'Max' },
          { type: 'min', name: 'Min' },
        ],
      };
    }

    // Mark lines (Benchmark line & Axis Break cutoff line) on the first primary series
    if (idx === 0) {
      const markLineData: any[] = [];

      if (showBenchmark && benchmark && typeof benchmark.value === 'number') {
        markLineData.push(
          isVertical
            ? {
                yAxis: benchmark.value,
                lineStyle: { color: '#ef4444', type: 'dashed', width: 2 },
                label: {
                  position: 'end',
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
              }
            : {
                xAxis: benchmark.value,
                lineStyle: { color: '#ef4444', type: 'dashed', width: 2 },
                label: {
                  position: 'start',
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
              }
        );
      }

      // Visual Broken Axis Cutoff Line //
      if (axisBreak.enabled && axisBreak.effectiveCutoff < axisBreak.displayMax) {
        markLineData.push(
          isVertical
            ? {
                yAxis: axisBreak.effectiveCutoff,
                lineStyle: {
                  color: isDark ? '#a855f7' : '#9333ea',
                  type: [4, 4],
                  width: 1.5,
                },
                label: {
                  position: 'insideEndTop',
                  formatter: `// Taglio Asse: ${axisBreak.effectiveCutoff.toLocaleString('it-IT')}`,
                  color: isDark ? '#d8b4fe' : '#7e22ce',
                  fontSize: 10,
                  fontWeight: 600,
                  backgroundColor: isDark ? 'rgba(30, 27, 75, 0.85)' : 'rgba(243, 232, 255, 0.85)',
                  borderColor: isDark ? '#6b21a8' : '#d8b4fe',
                  borderWidth: 1,
                  borderRadius: 3,
                  padding: [2, 5],
                },
              }
            : {
                xAxis: axisBreak.effectiveCutoff,
                lineStyle: {
                  color: isDark ? '#a855f7' : '#9333ea',
                  type: [4, 4],
                  width: 1.5,
                },
                label: {
                  position: 'insideEndTop',
                  formatter: `// Taglio Asse: ${axisBreak.effectiveCutoff.toLocaleString('it-IT')}`,
                  color: isDark ? '#d8b4fe' : '#7e22ce',
                  fontSize: 10,
                  fontWeight: 600,
                  backgroundColor: isDark ? 'rgba(30, 27, 75, 0.85)' : 'rgba(243, 232, 255, 0.85)',
                  borderColor: isDark ? '#6b21a8' : '#d8b4fe',
                  borderWidth: 1,
                  borderRadius: 3,
                  padding: [2, 5],
                },
              }
        );
      }

      if (markLineData.length > 0) {
        seriesItem.markLine = {
          symbol: ['none', 'none'],
          silent: false,
          data: markLineData,
        };
      }
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
