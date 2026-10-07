import { StackingMode, StratumBarTransformedProps, ValuePosition } from '../types';
import { getCategoryAxisConfig, getValueAxisConfig, getSecondaryValueAxisConfig, getLegendConfig, getTooltipConfig, getGridConfig, getTooltipFormatter } from '../utils/echartsUtils';
import { calculateAxisBreak, transformValueForAxisBreak } from '../utils/axisBreakUtils';
import { getNumberFormatter } from '@superset-ui/core';
import { compute2DValueExtent, getBarBorderRadius } from '../utils/barLayout';
import {
  SMART_ANNOTATION_STYLE_2D,
  arrangeAxes,
  buildLineSeries,
  getAxisBreakCutLine,
  getBenchmarkLabel,
  getBenchmarkLineStyle,
  getItemOpacity,
  getSmartAnnotationMarkPoint,
  isItemSelected,
} from '../utils/seriesScaffolding';

import { adjustColorBrightness } from '../utils/colors';

const POSITIVE_BAR_COLOR = '#1e8e3e';
const NEGATIVE_BAR_COLOR = '#d93025';

/** Linear gradient along the bar length, from `color` to a darker shade. */
function getBarGradient(color: string, isVertical: boolean, darken: number) {
  return {
    type: 'linear' as const,
    x: 0,
    y: 0,
    x2: isVertical ? 0 : 1,
    y2: isVertical ? 1 : 0,
    colorStops: [
      { offset: 0, color },
      { offset: 1, color: adjustColorBrightness(color, darken) },
    ],
  };
}

/**
 * Formats a 2D bar label from the original (pre axis-break) value. In stacked
 * mode near-zero segments (< 1.5% of the axis max) are hidden to avoid clutter.
 */
export function format2DBarLabel(
  params: any,
  options: { stacking: StackingMode; effectiveMaxVal?: number; numberFormat?: string },
): string {
  const { stacking, effectiveMaxVal, numberFormat } = options;
  const rawItem = params.data;
  const isCapped = rawItem?.isCapped;
  const realVal = rawItem?.originalVal !== undefined ? rawItem.originalVal : params.value;
  if (realVal === null || realVal === undefined) return '';
  if (typeof realVal === 'number') {
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
}

/** ECharts label config of 2D bars for the given value position (stacked bars always label inside). */
export function get2DBarLabelConfig(options: {
  showValue: boolean;
  valuePosition: ValuePosition;
  stacking: StackingMode;
  isVertical: boolean;
  isDark: boolean;
  formatter: (params: any) => string;
}) {
  const { showValue, valuePosition, stacking, isVertical, isDark, formatter } = options;
  const isInsideStyle = stacking !== 'none' || valuePosition === 'inside';
  return {
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
    color: isInsideStyle
      ? '#ffffff'
      : (isDark ? '#f8fafc' : '#1f2937'),
    textBorderColor: isInsideStyle
      ? 'rgba(0, 0, 0, 0.75)'
      : (isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.9)'),
    textBorderWidth: isInsideStyle ? 2.5 : 1.5,
    fontWeight: 600,
    fontSize: 11,
    minMargin: 4,
    formatter,
  };
}

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

  const axisBreak = calculateAxisBreak(series, isStacked, categories.length, {
    enabled: enableAxisBreak,
    mode: axisBreakMode,
    threshold: axisBreakThreshold,
  });

  const { maxVal, minVal } = compute2DValueExtent(series, categories.length, isStacked, benchmark);

  const effectiveMaxVal = axisBreak.enabled && axisBreak.hasOutliers ? axisBreak.displayMax : (maxVal > 0 ? maxVal : undefined);
  const effectiveMinVal = minVal < 0 ? minVal : undefined;
  const trackMax = Math.ceil((effectiveMaxVal || 100) * 1.15);

  const categoryAxis = getCategoryAxisConfig(categories, isVertical, isDark, isVertical ? xAxisTitle : yAxisTitle);

  // Pass effective max and min so the outlier zone or standard scale has a proper limit
  const valueAxis = getValueAxisConfig(
    isVertical,
    isDark,
    isVertical ? yAxisTitle : xAxisTitle,
    effectiveMaxVal,
    effectiveMinVal
  );

  const secondaryValueAxis = getSecondaryValueAxisConfig(isVertical, secondaryLineColor, yAxis2Format, yAxis2Title);

  const echartsSeries: any[] = [];

  if (showTrackBackground && stacking === 'none') {
    echartsSeries.push({
      name: '__track_bg__',
      type: 'bar',
      silent: true,
      itemStyle: {
        color: isDark ? 'rgba(51, 65, 85, 0.35)' : 'rgba(229, 231, 235, 0.45)',
        borderRadius: getBarBorderRadius(isVertical, barBorderRadius),
      },
      barGap: '-100%',
      data: categories.map(() => trackMax),
      z: 1,
    });
  }

  series.forEach((s, idx) => {
    const isSecondary = s.yAxisIndex === 1;
    const baseColor = s.color || colorScheme[idx % colorScheme.length] || '#2563eb';

    if (s.seriesType === 'line') {
      echartsSeries.push(buildLineSeries({
        name: s.name,
        data: s.data,
        baseColor,
        isVertical,
        yAxisIndex: s.yAxisIndex,
        isDark,
        showValue,
        yAxis2Format,
        lineWidth: secondaryLineWidth,
        areaGradient: secondaryAreaGradient,
        shadowAlpha: 0.35,
        areaAlpha: 0.25,
        z: 10,
      }));
      return;
    }

    // Bars of a non-stacked primary series with negative values are colored green/red by sign.
    const isSignedSeries = !isSecondary && stacking === 'none' && minVal < 0;
    const barData = s.data.map((val, catIdx) => {
      const catName = categories[catIdx] || '';
      const isSelected = isItemSelected(props.selectedValues, catName, s.name);

      const { visualVal, isCapped, originalVal } = axisBreak.enabled && !isSecondary
        ? transformValueForAxisBreak(val, axisBreak)
        : { visualVal: val, isCapped: false, originalVal: val };

      const isNegative = typeof visualVal === 'number' && visualVal < 0;
      const itemColor = isSignedSeries && typeof visualVal === 'number'
        ? getBarGradient(visualVal >= 0 ? POSITIVE_BAR_COLOR : NEGATIVE_BAR_COLOR, isVertical, -15)
        : undefined;

      return {
        value: visualVal,
        originalVal: originalVal,
        isCapped: isCapped,
        name: catName,
        itemStyle: {
          color: itemColor,
          borderRadius: getBarBorderRadius(isVertical, barBorderRadius, isNegative),
          opacity: getItemOpacity(isSelected),
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
        color: getBarGradient(baseColor, isVertical, -20),
        borderRadius: getBarBorderRadius(isVertical, barBorderRadius),
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
      label: get2DBarLabelConfig({
        showValue,
        valuePosition,
        stacking,
        isVertical,
        isDark,
        formatter: (params: any) => format2DBarLabel(params, { stacking, effectiveMaxVal, numberFormat }),
      }),
      z: 2,
    };

    if (props.showSmartAnnotations) {
      seriesItem.markPoint = getSmartAnnotationMarkPoint(baseColor, isDark, SMART_ANNOTATION_STYLE_2D);
    }

    // Benchmark and axis-break cutoff lines are attached to the first series only
    if (idx === 0) {
      const markLineData: any[] = [];

      if (showBenchmark && benchmark && typeof benchmark.value === 'number') {
        markLineData.push({
          ...(isVertical ? { yAxis: benchmark.value } : { xAxis: benchmark.value }),
          lineStyle: getBenchmarkLineStyle(),
          label: getBenchmarkLabel(benchmark, isVertical ? 'end' : 'start'),
        });
      }

      if (axisBreak.enabled && axisBreak.effectiveCutoff < axisBreak.displayMax) {
        markLineData.push(getAxisBreakCutLine(isVertical, isDark, axisBreak.effectiveCutoff));
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

  const tooltipFormatter = getTooltipFormatter(categories, isDark, colorScheme, showBenchmark, benchmark, yAxis2Title, yAxis2Format, hasDualYAxis ? secondaryLineColor : undefined, false, isVertical);
  const tooltip = getTooltipConfig(isDark, tooltipFormatter);

  // Legend with explicit per-series colors so the legend swatches match the bars
  const legend = getLegendConfig(series, colorScheme, showLegend || false, legendOrientation || 'top', isDark);
  const { xAxis, yAxis } = arrangeAxes(isVertical, hasDualYAxis, categoryAxis, valueAxis, secondaryValueAxis);

  return {
    backgroundColor: 'transparent',
    animationDuration: 600,
    aria: { enabled: true, decal: { show: enableA11yDecal } },
    grid: getGridConfig(isVertical, hasDualYAxis || false, legendOrientation || 'top'),
    tooltip,
    legend,
    xAxis,
    yAxis,
    series: echartsSeries,
  };
}
