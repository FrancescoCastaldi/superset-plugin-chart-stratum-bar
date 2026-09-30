import { resolveColors, resolveDimensions, computeBenchmark } from './transformPropsUtils';
import { buildSeriesRepresentation } from './seriesBuilder';
import { buildCrossFilterHandler } from './crossFilterHandler';
import {
  ChartProps,
  DataRecord,
  CategoricalColorNamespace,
  getNumberFormatter,
  ensureIsArray,
} from '@superset-ui/core';
import {
  StratumBarChartProps,
  StratumBarFormData,
  StratumBarTransformedProps,
  StratumBarSeries,
  StratumBarSeriesItem,
  BenchmarkConfig,
} from '../types';



export default function transformProps(chartProps: ChartProps): StratumBarTransformedProps {
  const { width, height, formData, queriesData, hooks } = chartProps as StratumBarChartProps;
  const fd = (formData || {}) as StratumBarFormData;
  const data = (queriesData?.[0]?.data || []) as DataRecord[];

  const {
    x_axis,
    x_axis_group,
    groupby = [],
    metrics = [],
    target_metric,
    secondary_metrics,
    secondary_series_type = 'line',
    y_axis_2_title,
    y_axis_2_format = ',.2f',
    secondary_area_gradient = true,
    secondary_line_width = 3,
    secondary_line_color = '#ea580c',
    theme_mode = 'light',
    enable_a11y_decal = false,
    combine_category_breakdown = false,
    viewMode = '3d',
    orientation = 'vertical',
    stacking = 'none',
    barShape3D = 'prism',
    depth3D = 20,
    tilt3D = 25,
    shadow3D = true,
    barBorderRadius = 6,
    showTrackBackground = false,
    showBenchmark = false,
    benchmarkType = 'fixed_value',
    benchmarkValue = 100,
    showDeltaBadge = true,
    deltaPolarity = 'normal',
    showValue = true,
    valuePosition = 'top',
    numberFormat = ',.0f',
    color_scheme,
    show_legend = true,
    legendOrientation = 'top',
    emit_filter = true,
    enableToolbar = true,
    toolbar_show_view_mode = true,
    toolbar_show_orientation = true,
    toolbar_show_stacking = true,
    toolbar_show_dual_axis = true,
    toolbar_show_breakdown_toggle = true,
    toolbar_show_benchmark = true,
    toolbar_show_export = true,
    enable_axis_break = false,
    axis_break_mode = 'auto',
    axis_break_threshold,
    toolbar_show_axis_break = true,
    x_axis_title,
    y_axis_title,
  } = fd;

  const rawFd = ((chartProps as any).rawFormData || {}) as any;
  const filterState = (chartProps as any).filterState || {};
  const selectedValues: string[] = ensureIsArray(filterState.selectedValues || filterState.value);

  // Helper to extract string column name from string, Column object, or adhoc column
  const getColName = (col: any): string => {
    if (!col) return '';
    if (typeof col === 'string') return col;
    if (typeof col === 'object') {
      return col.label || col.sqlExpression || col.column_name || col.name || String(col);
    }
    return String(col);
  };

  const sampleRow = data[0] || {};
  const rowKeys = Object.keys(sampleRow);
  const findRowKey = (name?: string) => {
    if (!name) return undefined;
    return rowKeys.find(k => k.toLowerCase() === name.toLowerCase());
  };

  // Extract dimension candidates
  const { resolvedXAxis, actualXKey, actualBreakdownKey, secondaryDimName } = resolveDimensions(fd, sampleRow);
  const breakdownCol = secondaryDimName;

  // Resolve metrics
  const rawMetrics = fd.metrics && (Array.isArray(fd.metrics) ? fd.metrics.length > 0 : true)
    ? ensureIsArray(fd.metrics)
    : fd.metric
    ? [fd.metric]
    : [];
  const metricList = rawMetrics.map((m: any) => (typeof m === 'object' && m !== null ? m.label || m.metric_name : String(m)));
  const primaryMetric = metricList[0] || 'value';
  const targetMetricKey = typeof target_metric === 'object' && target_metric !== null
    ? target_metric.label || target_metric.metric_name
    : target_metric ? String(target_metric) : undefined;

  const formatter = getNumberFormatter(numberFormat);

  // 1. Resolve Dashboard Label Colors & Manual JSON Colors
  // Effective color scheme: prioritize dashboard color scheme if present
  const effectiveColorScheme = fd.color_scheme || rawFd.color_scheme;
  let scaleInstance: any = null;
  if (effectiveColorScheme) {
    try {
      scaleInstance = CategoricalColorNamespace.getScale(effectiveColorScheme);
    } catch {
      // Fallback
    }
  }

  // Dashboard metadata passes label_colors in rawFormData.label_colors or formData.label_colors
  const { combinedLabelColors, palette, getColor } = resolveColors(fd, rawFd, scaleInstance);


  // 2. Determine Data Structure: PIVOTED vs UNPIVOTED
  // In Superset, Timeseries pivotOperator pivots the dataframe:
  // sampleRow has columns like: { CANALE: 'App', 'Convenzioni': 7, 'Libera professione': 13, 'SSN': 120, 'Solventi': 17 }
  const secondaryMetricNames = ensureIsArray(secondary_metrics)
    .map(m => (typeof m === 'object' && m !== null ? m.label || m.metric_name : String(m)))
    .filter(Boolean)
    .map(s => s.toLowerCase());

  const potentialPivotedKeys = Object.keys(sampleRow).filter(k =>
    k.toLowerCase() !== actualXKey.toLowerCase() &&
    k !== '__timestamp' &&
    !k.startsWith('__') &&
    k !== targetMetricKey &&
    !secondaryMetricNames.includes(k.toLowerCase()) &&
    typeof sampleRow[k] === 'number'
  );
  const isPivoted =
    potentialPivotedKeys.length > 0 &&
    (!actualBreakdownKey || !(actualBreakdownKey in sampleRow)) &&
    !(potentialPivotedKeys.length === 1 && potentialPivotedKeys[0].toLowerCase() === primaryMetric.toLowerCase());

  // Determine actual metric column in row
  const actualMetricKey = Object.keys(sampleRow).find(k => k.toLowerCase() === primaryMetric.toLowerCase()) || primaryMetric;

  // Secondary metrics setup
  const secondaryMetricList = ensureIsArray(secondary_metrics)
    .map(m => (typeof m === 'object' && m !== null ? m.label || m.metric_name : String(m)))
    .filter(Boolean);
  const secFormatter = getNumberFormatter(y_axis_2_format);
  const secPalette = ['#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#06b6d4'];

  // Sorting configuration
  const sortBy = fd.sort_by || ((fd as any).timeseries_limit_metric ? 'metric' : 'category');
  const isOrderDesc = fd.order_desc === true;

  // Helper to build categories and series for either separated or combined representation
  const buildRepresentation = (combineFlag: boolean) => {
    return buildSeriesRepresentation({
      data, isPivoted, actualXKey, actualBreakdownKey, actualMetricKey,
      targetMetricKey, primaryMetric, metricList, secondaryMetricList,
      y_axis_2_format, getColor, palette, formatter, resolvedXAxis, secFormatter,
      secondary_line_color, secondary_series_type, secPalette,
      combineFlag, sampleRow, potentialPivotedKeys,
      sortBy, isOrderDesc,
    });
  };

  const standardRep = buildRepresentation(false);
  const combinedRep = actualBreakdownKey && actualBreakdownKey in sampleRow ? buildRepresentation(true) : standardRep;

  const currentRep = combine_category_breakdown ? combinedRep : standardRep;
  const categories = currentRep.categories;
  const series = currentRep.series;


  // 3. Compute Benchmark if enabled
  const benchmark = computeBenchmark(series, showBenchmark, benchmarkType || '', Number(benchmarkValue) || 0, formatter);
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

  // 4. Cross-filtering hook with toggle support
  const { setDataMask, onAddFilter } = (hooks || {}) as any;
  const currentSelected = selectedValues;

  const onCrossFilter = buildCrossFilterHandler({
    emit_filter,
    actualBreakdownKey,
    primaryMetric,
    currentSelected,
    actualXKey,
    setDataMask,
    onAddFilter
  });

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
    hasDualYAxis: series.some(s => s.yAxisIndex === 1),
    yAxis2Title: y_axis_2_title,
    yAxis2Format: y_axis_2_format,
    secondaryAreaGradient: secondary_area_gradient,
    secondaryLineWidth: Number(secondary_line_width) || 3,
    secondaryLineColor: secondary_line_color || '#ea580c',
    themeMode: theme_mode,
    enableA11yDecal: enable_a11y_decal,
    breakdownDimName: actualBreakdownKey,
    canCombineBreakdown: Boolean(actualBreakdownKey && actualBreakdownKey in sampleRow),
    combineCategoryBreakdown: combine_category_breakdown,
    standardCategories: standardRep.categories,
    standardSeries: standardRep.series,
    combinedCategories: combinedRep.categories,
    combinedSeries: combinedRep.series,
    enableAxisBreak: Boolean(enable_axis_break),
    axisBreakMode: axis_break_mode,
    axisBreakThreshold: axis_break_threshold !== undefined && axis_break_threshold !== null ? Number(axis_break_threshold) : undefined,
    toolbarConfig: {
      showViewMode: toolbar_show_view_mode !== false,
      showOrientation: toolbar_show_orientation !== false,
      showStacking: toolbar_show_stacking !== false,
      showDualAxis: toolbar_show_dual_axis !== false,
      showBreakdownToggle: toolbar_show_breakdown_toggle !== false,
      showBenchmark: toolbar_show_benchmark !== false,
      showAxisBreak: toolbar_show_axis_break !== false,
      showExport: toolbar_show_export !== false,
    },
    formData: fd,
    selectedValues,
    labelColors: combinedLabelColors,
    renderer: fd.renderer || 'canvas',
    onCrossFilter,
  };
}
