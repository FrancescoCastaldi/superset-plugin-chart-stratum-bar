import { buildQueryContext, QueryContext, ensureIsArray } from '@superset-ui/core';
import { StratumBarFormData } from '../types';

export default function buildQuery(formData: StratumBarFormData): QueryContext {
  const fd: any = { ...(formData || {}) };
  // Sanitize x_axis and x_axis_group so Superset backend never receives a list for x_axis
  if (Array.isArray(fd.x_axis)) {
    fd.x_axis = fd.x_axis.length > 0 ? fd.x_axis[0] : null;
  }
  if (Array.isArray(fd.x_axis_group)) {
    fd.x_axis_group = fd.x_axis_group.length > 0 ? fd.x_axis_group[0] : null;
  }

  const {
    x_axis,
    x_axis_group,
    groupby = [],
    target_metric,
    secondary_metrics,
  } = fd;

  return buildQueryContext(fd as any, (baseQueryObject: any) => {
    // Helper to extract column key
    const getDimKey = (col: any): string => {
      if (!col) return '';
      if (typeof col === 'string') return col;
      if (typeof col === 'object' && col !== null) {
        return col.label || col.sqlExpression || col.column_name || col.name || String(col);
      }
      return String(col);
    };

    // Collect all dimension candidates
    const rawXAxis = ensureIsArray(x_axis);
    const rawXGroup = x_axis_group ? [x_axis_group] : [];
    const rawBreakdown = ensureIsArray(groupby);

    const allDims = [...rawXGroup, ...rawXAxis, ...rawBreakdown].filter(Boolean);

    // Filter duplicates by dimension name
    const seenKeys = new Set<string>();
    const columns: any[] = [];
    allDims.forEach(dim => {
      const k = getDimKey(dim).toLowerCase();
      if (k && !seenKeys.has(k)) {
        seenKeys.add(k);
        columns.push(dim);
      }
    });

    // Fallback if empty
    if (columns.length === 0 && rawBreakdown.length > 0) {
      columns.push(rawBreakdown[0]);
    }

    // Collect all required metrics including optional target_metric and secondary_metrics
    const rawMetrics = fd.metrics && (Array.isArray(fd.metrics) ? fd.metrics.length > 0 : true)
      ? ensureIsArray(fd.metrics)
      : fd.metric
      ? [fd.metric]
      : [];
    const resolvedMetrics = [...rawMetrics];
    if (target_metric && !resolvedMetrics.includes(target_metric)) {
      resolvedMetrics.push(target_metric);
    }
    ensureIsArray(secondary_metrics).forEach(sm => {
      if (sm && !resolvedMetrics.includes(sm)) {
        resolvedMetrics.push(sm);
      }
    });

    // Explicitly merge base filters with extra_form_data filters (native dashboard & cross filters)
    const baseFilters = ensureIsArray(baseQueryObject.filters);
    const extraFilters = ensureIsArray(fd.extra_form_data?.filters);
    const mergedFilters = [...baseFilters];

    extraFilters.forEach(ef => {
      if (ef && ef.col) {
        const alreadyExists = mergedFilters.some(
          mf => mf.col === ef.col && mf.op === ef.op && JSON.stringify(mf.val) === JSON.stringify(ef.val)
        );
        if (!alreadyExists) {
          mergedFilters.push(ef);
        }
      }
    });

    // Merge adhoc filters from extra_form_data
    const baseAdhoc = ensureIsArray(baseQueryObject.adhoc_filters || fd.adhoc_filters);
    const extraAdhoc = ensureIsArray(fd.extra_form_data?.adhoc_filters);
    const mergedAdhoc = [...baseAdhoc, ...extraAdhoc];

    // Ordering logic: configurable sort by category dimension vs metric value
    const sortBy = fd.sort_by || (fd.timeseries_limit_metric ? 'metric' : 'category');
    let orderby: any[] = [];

    if (sortBy === 'category') {
      // For category, order_desc === true means descending (Z-A / 7-1), false means ascending (A-Z / 1-7)
      const isOrderDesc = fd.order_desc === true;
      const catCol = columns.length > 0 ? columns[0] : (fd.x_axis || null);
      if (catCol) {
        orderby = [[catCol, !isOrderDesc]];
      }
    } else {
      // sortBy === 'metric'
      // For metric, order_desc !== false means descending (Top N), false means ascending
      const isOrderDesc = fd.order_desc !== false;
      const sortMetric = fd.timeseries_limit_metric || (resolvedMetrics.length > 0 ? resolvedMetrics[0] : null);
      if (sortMetric) {
        orderby = [[sortMetric, !isOrderDesc]];
      }
    }

    if (orderby.length === 0 && baseQueryObject.orderby) {
      orderby = baseQueryObject.orderby;
    }

    return [
      {
        ...baseQueryObject,
        columns,
        groupby: columns,
        series_columns: rawBreakdown,
        metrics: resolvedMetrics,
        orderby,
        filters: mergedFilters,
        adhoc_filters: mergedAdhoc,
      },
    ];
  });
}
