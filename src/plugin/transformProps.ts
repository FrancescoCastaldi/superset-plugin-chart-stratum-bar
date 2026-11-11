import { resolveColors, resolveDimensions, computeBenchmark } from './transformPropsUtils';
import { periodTitle, readDashboardPeriods, withNoData } from '../utils/dashboardPeriods';
import {
  comparisonTexts,
  formatRange,
  getQueryTimeRange,
  parseRange,
  resolveComparisonMode,
  shiftName,
  shiftRange,
  DEFAULT_COMPARISON_SHIFT,
} from '../utils/comparison';
import { buildSeriesRepresentation } from './seriesBuilder';
import { buildCrossFilterHandler } from './crossFilterHandler';
import { convertTimeColumns, formatDuration, TimeFormatOptions } from '../utils/timeValues';
import {
  ChartProps,
  DataRecord,
  CategoricalColorNamespace,
  getNumberFormatter,
  ensureIsArray,
} from '@superset-ui/core';
import {
  ComparisonInfo,
  StratumBarChartProps,
  StratumBarFormData,
  StratumBarTransformedProps,
} from '../types';

/** Old English defaults of the label controls: a saved chart still holds them, they mean "automatic" */
const LEGACY_LABELS = ['Time 1 (reference)', 'Time 2 (comparison)'];

const cleanLabel = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed && !LEGACY_LABELS.includes(trimmed) ? trimmed : undefined;
};



export default function transformProps(chartProps: ChartProps): StratumBarTransformedProps {
  const { width, height, formData, queriesData, hooks } = chartProps as StratumBarChartProps;
  // On a dashboard Superset hands over `formData` in camelCase while the options of this chart are
  // read in snake_case: `rawFormData` keeps the names typed in the control panel
  const fd = { ...((chartProps as any).rawFormData || {}), ...(formData || {}) } as StratumBarFormData;
  const queryData = (queriesData?.[0]?.data || []) as DataRecord[];

  const {
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
    show_smart_annotations = false,
    showBenchmark = false,
    benchmarkType = 'fixed_value',
    benchmarkValue = 100,
    showDeltaBadge = true,
    deltaPolarity = 'normal',
    showValue = true,
    valuePosition = 'top',
    numberFormat = ',.0f',
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
    time_detection = 'auto',
    time_display_format = 'auto',
    time_fraction_digits = 0,
    time_comparison_mode,
    show_comparison_delta,
    comparison_delta_polarity,
    comparison_shift,
  } = fd;

  const rawFd = ((chartProps as any).rawFormData || {}) as any;
  const filterState = (chartProps as any).filterState || {};
  const selectedValues: string[] = ensureIsArray(filterState.selectedValues || filterState.value);

  // The dimensions are found on the rows as they come: a category written like a time ("08:00") stays text
  const { resolvedXAxis, actualXKey, actualBreakdownKey } = resolveDimensions(fd, queryData[0] || {});

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

  // Metrics of type Time arrive as text ("00:12:54.425000"): they become seconds, only the metric
  // columns are looked at, never the categories
  const comparisonMetricRaw = fd.comparison_metric;
  const declaredMetrics = [
    ...metricList,
    targetMetricKey,
    ...ensureIsArray(secondary_metrics).map((m: any) => (typeof m === 'object' && m !== null ? m.label || m.metric_name : String(m))),
    typeof comparisonMetricRaw === 'object' && comparisonMetricRaw !== null
      ? comparisonMetricRaw.label || comparisonMetricRaw.metric_name
      : comparisonMetricRaw,
  ].filter((m): m is string => typeof m === 'string' && m.length > 0);
  const firstRowKeys = Object.keys(queryData[0] || {});
  // Columns of the second period (`<metric>__<offset>`) are times when their metric is
  const timeCandidates = [
    ...declaredMetrics,
    ...firstRowKeys.filter(k => declaredMetrics.some(m => k.toLowerCase().startsWith(`${m.toLowerCase()}__`))),
  ];
  const { rows: data, timeKeys } =
    time_detection === 'off' ? { rows: queryData, timeKeys: [] as string[] } : convertTimeColumns(queryData, timeCandidates);
  const timeKeySet = new Set(timeKeys.map(k => k.toLowerCase()));
  const sampleRow = data[0] || {};

  let timeFormat: TimeFormatOptions | undefined;
  if (timeKeys.length > 0) {
    let referenceSeconds = 0;
    data.forEach(row => timeKeys.forEach(k => {
      const v = row[k];
      if (typeof v === 'number' && Math.abs(v) > referenceSeconds) referenceSeconds = Math.abs(v);
    }));
    timeFormat = {
      format: time_display_format,
      fractionDigits: Number(time_fraction_digits) || 0,
      referenceSeconds,
    };
  }
  const timeFormatter = (seconds: number) => formatDuration(seconds, timeFormat);

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

  // ----- Comparison between two periods -----
  const dashboardPeriods = readDashboardPeriods(fd.extra_form_data);
  const mode = resolveComparisonMode(time_comparison_mode);
  const locale: 'it' | 'en' = dashboardPeriods.locale === 'en' ? 'en' : 'it';
  const texts = comparisonTexts(locale);
  const t1Range = getQueryTimeRange(fd);
  const shift: string = comparison_shift || DEFAULT_COMPARISON_SHIFT;
  const dashboardTimeCompare = ensureIsArray((fd.extra_form_data as any)?.time_compare).filter(Boolean);

  // With time offsets the query returns the second period as `<metric>__<offset>`
  const offsetKey =
    mode === 'time_offsets' || mode === 'time_shift'
      ? Object.keys(sampleRow).find(
          k =>
            k.toLowerCase() !== primaryMetric.toLowerCase() &&
            k.toLowerCase().startsWith(`${primaryMetric.toLowerCase()}__`) &&
            (typeof sampleRow[k] === 'number' || sampleRow[k] === null),
        )
      : undefined;
  const comparisonMetricName = typeof fd.comparison_metric === 'object' && fd.comparison_metric !== null
    ? fd.comparison_metric.label || fd.comparison_metric.metric_name
    : fd.comparison_metric;
  const comparisonKey: string | undefined =
    mode === 'dual_metric' ? (comparisonMetricName ? String(comparisonMetricName) : undefined) : offsetKey;
  // The second period is drawn when its column came back from the query: buildQuery asks for offsets
  // only when T1 is a closed range, so a column in the data is the proof that the comparison ran
  const comparisonActive = mode !== 'none' && Boolean(comparisonKey);

  // Names of the two periods: the labels typed in the control panel win, then the names and ranges of
  // the Calendar Filter, then what can be computed from the period itself
  // The control is saved as `time1_label`; `time_1_label` is read too, for charts saved with that name
  const typedT1 = cleanLabel(fd.time1_label) || cleanLabel(fd.time_1_label);
  const typedT2 = cleanLabel(fd.time2_label) || cleanLabel(fd.time_2_label);
  const t1Name =
    typedT1 ||
    periodTitle(dashboardPeriods.referenceName, dashboardPeriods.referenceText) ||
    (t1Range ? `${texts.current} · ${formatRange(t1Range, locale)}` : texts.current);

  let t2Name: string;
  if (mode === 'time_shift') {
    const shifted = t1Range ? shiftRange(t1Range, shift) : undefined;
    t2Name =
      typedT2 ||
      (shifted ? `${shiftName(shift, locale)} · ${formatRange(shifted, locale)}` : shiftName(shift, locale));
  } else if (mode === 'time_offsets') {
    // Without names from the filter, the range of the comparison period is shown when it is readable
    const offsetRange = parseRange(dashboardTimeCompare[0]);
    t2Name =
      typedT2 ||
      periodTitle(dashboardPeriods.comparisonName, dashboardPeriods.comparisonText) ||
      (offsetRange ? `${texts.comparison} · ${formatRange(offsetRange, locale)}` : texts.comparison);
  } else {
    t2Name = typedT2 || texts.comparison;
  }

  // A comparison period without a single value (no rows in it) is still shown, and said to be empty
  const comparisonIsEmpty =
    Boolean(offsetKey) && data.every(row => row[offsetKey as string] === null || row[offsetKey as string] === undefined);
  const t2Title = comparisonIsEmpty ? withNoData(t2Name, locale) || t2Name : t2Name;

  // Why the second period cannot be drawn, in the language of the filter
  let comparisonNotice: string | undefined;
  if (mode === 'time_offsets' && !comparisonActive) {
    comparisonNotice = !t1Range ? texts.noRangeForShift : dashboardTimeCompare.length === 0 ? texts.noFilterComparison : undefined;
  } else if (mode === 'time_shift' && !comparisonActive) {
    comparisonNotice = texts.noRangeForShift;
  }

  const comparisonInfo: ComparisonInfo = {
    mode,
    active: comparisonActive,
    t1Name,
    t2Name: t2Title,
    showDelta: show_comparison_delta !== false,
    polarity: comparison_delta_polarity === 'inverted' ? 'inverted' : 'normal',
    locale,
    notice: comparisonNotice,
  };

  const potentialPivotedKeys = Object.keys(sampleRow).filter(k =>
    // Columns `<metric>__<offset>` are never series of their own: they belong to the comparison
    !k.toLowerCase().startsWith(`${primaryMetric.toLowerCase()}__`) &&
    k !== offsetKey &&
    k !== comparisonKey &&
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
  const sortBy = fd.sort_by || ((fd as any).timeseries_limit_metric ? 'metric' : 'original');
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
      timeComparisonMode: mode,
      timeKeys: timeKeySet,
      timeFormatter,
      comparisonMetric: comparisonActive ? comparisonKey : undefined,
      time1Label: comparisonInfo.t1Name,
      time2Label: comparisonInfo.t2Name,
      locale,
    });
  };

  const standardRep = buildRepresentation(false);
  const canCombine = Boolean(actualBreakdownKey && actualBreakdownKey in sampleRow);
  const combinedRep = canCombine ? buildRepresentation(true) : standardRep;

  // With two periods on screen, the series of the breakdown are shown as "category · series" so that
  // each bar pair (T1 and T2) belongs to one combination
  const currentRep = (combine_category_breakdown || (comparisonActive && canCombine)) ? combinedRep : standardRep;
  const categories = currentRep.categories;
  const series = currentRep.series;


  // 3. Compute Benchmark if enabled
  // The benchmark is written as a duration when every bar of the primary axis is a Time field
  const primaryBars = series.filter(s => s.yAxisIndex !== 1 && s.seriesType !== 'line');
  const benchmarkIsTime = primaryBars.length > 0 && primaryBars.every(s => s.valueKind === 'time');
  const benchmark = computeBenchmark(
    series, showBenchmark, benchmarkType || '', Number(benchmarkValue) || 0,
    benchmarkIsTime ? timeFormatter : formatter,
    benchmarkIsTime,
  );
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
    showSmartAnnotations: show_smart_annotations,
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
    timeFormat,
    comparison: comparisonInfo,
    timeComparisonMode: mode,
    time1Label: comparisonInfo.t1Name,
    time2Label: comparisonInfo.t2Name,
    showComparisonDelta: comparisonInfo.showDelta,
    comparisonDeltaPolarity: comparisonInfo.polarity,
    formData: fd,
    selectedValues,
    labelColors: combinedLabelColors,
    renderer: fd.renderer || 'canvas',
    onCrossFilter,
  };
}
