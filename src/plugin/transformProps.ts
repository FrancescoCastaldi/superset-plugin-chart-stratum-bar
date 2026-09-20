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

const DEFAULT_COLORS = [
  '#3b82f6', // Sapphire Blue
  '#10b981', // Emerald Green
  '#f59e0b', // Amber Orange
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#6366f1', // Indigo
];

export default function transformProps(chartProps: ChartProps): StratumBarTransformedProps {
  const { width, height, formData, queriesData, hooks } = chartProps as StratumBarChartProps;
  const fd = (formData || {}) as StratumBarFormData;
  const data = (queriesData?.[0]?.data || []) as DataRecord[];

  const {
    x_axis,
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
    x_axis_title,
    y_axis_title,
  } = fd;

  // Helper to extract string column name from string, Column object, or adhoc column
  const getColName = (col: any): string => {
    if (!col) return '';
    if (typeof col === 'string') return col;
    if (typeof col === 'object') {
      return col.label || col.sqlExpression || col.column_name || col.name || String(col);
    }
    return String(col);
  };

  // Resolve Primary Category dimension
  const rawXAxis = x_axis || ensureIsArray(groupby)[0] || 'category';
  const resolvedXAxis = getColName(rawXAxis);

  // In data, find the exact key matching resolvedXAxis (case-insensitive)
  const sampleRow = data[0] || {};
  const actualXKey = Object.keys(sampleRow).find(k => k.toLowerCase() === resolvedXAxis.toLowerCase()) || resolvedXAxis;

  // Resolve Breakdown dimensions (dimensions other than x_axis)
  const breakdownCols = ensureIsArray(groupby).map(getColName).filter(col => col.toLowerCase() !== resolvedXAxis.toLowerCase());
  const breakdownCol = breakdownCols[0];
  const actualBreakdownKey = breakdownCol
    ? Object.keys(sampleRow).find(k => k.toLowerCase() === breakdownCol.toLowerCase())
    : undefined;

  // Resolve metrics
  const metricList = ensureIsArray(metrics).map(m => (typeof m === 'object' && m !== null ? m.label || m.metric_name : String(m)));
  const primaryMetric = metricList[0] || 'value';
  const targetMetricKey = typeof target_metric === 'object' && target_metric !== null
    ? target_metric.label || target_metric.metric_name
    : target_metric ? String(target_metric) : undefined;

  const formatter = getNumberFormatter(numberFormat);

  // Palette resolution with scale support
  let palette = DEFAULT_COLORS;
  let getColor = (key: string, idx: number) => palette[idx % palette.length];
  if (color_scheme) {
    try {
      const scale = CategoricalColorNamespace.getScale(color_scheme);
      if (scale) {
        if (typeof scale.colors === 'object' && Array.isArray(scale.colors)) {
          palette = scale.colors;
        }
        getColor = (key: string, idx: number) => scale.getColor(key) || palette[idx % palette.length];
      }
    } catch {
      // Fallback to default
    }
  }

  // 1. Collect unique ordered categories
  const categoriesSet = new Set<string>();
  data.forEach(row => {
    const val = row[actualXKey];
    if (val !== null && val !== undefined) {
      if (combine_category_breakdown && actualBreakdownKey && row[actualBreakdownKey]) {
        categoriesSet.add(`${val} [${row[actualBreakdownKey]}]`);
      } else {
        categoriesSet.add(String(val));
      }
    }
  });
  const categories = Array.from(categoriesSet);

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

  // 3. Build Series
  const series: StratumBarSeries[] = [];

  if (isPivoted) {
    // PIVOTED DATAFRAME: Column keys are the series names!
    potentialPivotedKeys.forEach((sName, sIdx) => {
      const seriesData: (number | null)[] = [];
      const seriesItems: StratumBarSeriesItem[] = [];

      categories.forEach(cat => {
        const row = data.find(r => String(r[actualXKey]) === cat);
        const rawVal = row ? row[sName] : null;
        const numVal = typeof rawVal === 'number' ? rawVal : rawVal !== null && !isNaN(Number(rawVal)) ? Number(rawVal) : null;
        seriesData.push(numVal);

        const targetVal = targetMetricKey && row ? Number(row[targetMetricKey]) || null : null;
        seriesItems.push({
          category: cat,
          value: numVal,
          formattedValue: numVal !== null ? formatter(numVal) : undefined,
          targetValue: targetVal,
          rawData: row,
        });
      });

      series.push({
        name: sName,
        key: sName,
        color: getColor(sName, sIdx),
        data: seriesData,
        items: seriesItems,
        yAxisIndex: 0,
        seriesType: 'bar',
      });
    });
  } else if (actualBreakdownKey && actualBreakdownKey in sampleRow) {
    // UNPIVOTED DATAFRAME: Group by breakdown column value (e.g. REGIME)
    const groupValuesSet = new Set<string>();
    data.forEach(row => {
      const gVal = row[actualBreakdownKey];
      if (gVal !== null && gVal !== undefined) {
        groupValuesSet.add(String(gVal));
      }
    });
    const groupValues = Array.from(groupValuesSet);

    // Map: groupVal -> (cat -> record)
    const lookup = new Map<string, Map<string, DataRecord>>();
    data.forEach(row => {
      const rawCat = row[actualXKey] !== null && row[actualXKey] !== undefined ? String(row[actualXKey]) : 'N/D';
      const cat = combine_category_breakdown && actualBreakdownKey && row[actualBreakdownKey]
        ? `${rawCat} [${row[actualBreakdownKey]}]`
        : rawCat;
      const gVal = row[actualBreakdownKey] !== null && row[actualBreakdownKey] !== undefined ? String(row[actualBreakdownKey]) : 'N/D';
      if (!lookup.has(gVal)) {
        lookup.set(gVal, new Map());
      }
      lookup.get(gVal)!.set(cat, row);
    });

    groupValues.forEach((gVal, sIdx) => {
      const gMap = lookup.get(gVal) || new Map();
      const seriesData: (number | null)[] = [];
      const seriesItems: StratumBarSeriesItem[] = [];

      // Determine metric column in row
      const actualMetricKey = Object.keys(sampleRow).find(k => k.toLowerCase() === primaryMetric.toLowerCase()) || primaryMetric;

      categories.forEach(cat => {
        const row = gMap.get(cat);
        const rawVal = row ? row[actualMetricKey] : null;
        const numVal = typeof rawVal === 'number' ? rawVal : rawVal !== null && !isNaN(Number(rawVal)) ? Number(rawVal) : null;
        seriesData.push(numVal);

        const targetVal = targetMetricKey && row ? Number(row[targetMetricKey]) || null : null;
        seriesItems.push({
          category: cat,
          value: numVal,
          formattedValue: numVal !== null ? formatter(numVal) : undefined,
          targetValue: targetVal,
          rawData: row,
        });
      });

      series.push({
        name: gVal,
        key: gVal,
        color: getColor(gVal, sIdx),
        data: seriesData,
        items: seriesItems,
        yAxisIndex: 0,
        seriesType: 'bar',
      });
    });
  } else if (metricList.length > 1) {
    // Multiple metrics (e.g., Target vs Actual)
    metricList.forEach((mKey, mIdx) => {
      const seriesData: (number | null)[] = [];
      const seriesItems: StratumBarSeriesItem[] = [];

      categories.forEach(cat => {
        const row = data.find(r => String(r[resolvedXAxis]) === cat);
        const rawVal = row ? row[mKey] : null;
        const numVal = typeof rawVal === 'number' ? rawVal : rawVal !== null && !isNaN(Number(rawVal)) ? Number(rawVal) : null;
        seriesData.push(numVal);

        seriesItems.push({
          category: cat,
          value: numVal,
          formattedValue: numVal !== null ? formatter(numVal) : undefined,
          rawData: row,
        });
      });

      series.push({
        name: mKey,
        key: mKey,
        color: palette[mIdx % palette.length],
        data: seriesData,
        items: seriesItems,
        yAxisIndex: 0,
        seriesType: 'bar',
      });
    });
  } else {
    // Single metric, single dimension
    const seriesData: (number | null)[] = [];
    const seriesItems: StratumBarSeriesItem[] = [];

    categories.forEach(cat => {
      const row = data.find(r => String(r[resolvedXAxis]) === cat);
      const rawVal = row ? row[primaryMetric] : null;
      const numVal = typeof rawVal === 'number' ? rawVal : rawVal !== null && !isNaN(Number(rawVal)) ? Number(rawVal) : null;
      seriesData.push(numVal);

      const targetVal = targetMetricKey && row ? Number(row[targetMetricKey]) || null : null;
      seriesItems.push({
        category: cat,
        value: numVal,
        formattedValue: numVal !== null ? formatter(numVal) : undefined,
        targetValue: targetVal,
        rawData: row,
      });
    });

    series.push({
      name: primaryMetric,
      key: primaryMetric,
      color: palette[0],
      data: seriesData,
      items: seriesItems,
      yAxisIndex: 0,
      seriesType: 'bar',
    });
  }

  // 2.bis Secondary Metrics for Right Y-Axis (Dual Axis)
  const secondaryMetricList = ensureIsArray(secondary_metrics)
    .map(m => (typeof m === 'object' && m !== null ? m.label || m.metric_name : String(m)))
    .filter(Boolean);

  if (secondaryMetricList.length > 0) {
    const secFormatter = getNumberFormatter(y_axis_2_format);
    const secPalette = ['#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#06b6d4'];

    secondaryMetricList.forEach((secMetricName, secIdx) => {
      const actualSecKey = Object.keys(sampleRow).find(
        k => k.toLowerCase() === secMetricName.toLowerCase()
      ) || secMetricName;

      const secData: (number | null)[] = [];
      const secItems: StratumBarSeriesItem[] = [];

      categories.forEach(cat => {
        // Trova tutte le righe corrispondenti a questa categoria
        const matchingRows = data.filter(r => {
          if (combine_category_breakdown && actualBreakdownKey && r[actualBreakdownKey]) {
            return `${r[actualXKey]} [${r[actualBreakdownKey]}]` === cat;
          }
          return String(r[actualXKey]) === cat;
        });

        let numVal: number | null = null;
        if (matchingRows.length > 0) {
          const vals = matchingRows
            .map(r => r[actualSecKey])
            .filter(v => typeof v === 'number' && !isNaN(v)) as number[];
          if (vals.length > 0) {
            numVal = vals.reduce((a, b) => a + b, 0) / vals.length;
          }
        }

        secData.push(numVal);
        secItems.push({
          category: cat,
          value: numVal,
          formattedValue: numVal !== null ? secFormatter(numVal) : undefined,
          rawData: matchingRows[0],
        });
      });

      const chosenColor = secIdx === 0 && secondary_line_color ? secondary_line_color : secPalette[secIdx % secPalette.length];
      series.push({
        name: secMetricName,
        key: `sec_${secMetricName}`,
        color: chosenColor,
        data: secData,
        items: secItems,
        yAxisIndex: 1,
        seriesType: secondary_series_type || 'line',
      });
    });
  }

  // 3. Compute Benchmark if enabled
  let benchmark: BenchmarkConfig | undefined;
  if (showBenchmark) {
    let resolvedBenchmarkVal = Number(benchmarkValue) || 0;
    let bLabel = `Benchmark (${formatter(resolvedBenchmarkVal)})`;

    if (benchmarkType === 'average') {
      const allVals: number[] = [];
      series.forEach(s => {
        s.data.forEach(v => {
          if (typeof v === 'number') allVals.push(v);
        });
      });
      if (allVals.length > 0) {
        resolvedBenchmarkVal = allVals.reduce((a, b) => a + b, 0) / allVals.length;
        bLabel = `Media (${formatter(resolvedBenchmarkVal)})`;
      }
    } else if (benchmarkType === 'median') {
      const allVals: number[] = [];
      series.forEach(s => {
        s.data.forEach(v => {
          if (typeof v === 'number') allVals.push(v);
        });
      });
      if (allVals.length > 0) {
        allVals.sort((a, b) => a - b);
        const mid = Math.floor(allVals.length / 2);
        resolvedBenchmarkVal = allVals.length % 2 !== 0 ? allVals[mid] : (allVals[mid - 1] + allVals[mid]) / 2;
        bLabel = `Mediana (${formatter(resolvedBenchmarkVal)})`;
      }
    }

    benchmark = {
      value: resolvedBenchmarkVal,
      label: bLabel,
    };

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
  }

  // 4. Cross-filtering hook
  const { setDataMask, onAddFilter } = (hooks || {}) as any;
  const onCrossFilter = (category: string, seriesName?: string) => {
    if (!emit_filter) return;

    if (typeof setDataMask === 'function') {
      setDataMask({
        extraFormData: {
          filters: [
            {
              col: actualXKey,
              op: 'IN',
              val: [category],
            },
          ],
        },
        filterState: {
          value: [category],
          label: category,
        },
      });
    } else if (typeof onAddFilter === 'function') {
      onAddFilter({
        col: actualXKey,
        op: 'IN',
        val: [category],
      });
    }
  };

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
    formData: fd,
    onCrossFilter,
  };
}
