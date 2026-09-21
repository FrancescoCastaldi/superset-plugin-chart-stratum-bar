import { buildQueryContext, QueryContext, ensureIsArray } from '@superset-ui/core';
import { StratumBarFormData } from '../types';

export default function buildQuery(formData: StratumBarFormData): QueryContext {
  const fd: any = formData || {};
  const {
    x_axis,
    x_axis_group,
    groupby = [],
    metrics = [],
    target_metric,
    secondary_metrics,
  } = fd;

  return buildQueryContext(formData as any, (baseQueryObject: any) => {
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
    const resolvedMetrics = [...ensureIsArray(metrics)];
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

    return [
      {
        ...baseQueryObject,
        columns,
        groupby: columns,
        series_columns: rawBreakdown,
        metrics: resolvedMetrics,
        filters: mergedFilters,
        adhoc_filters: mergedAdhoc,
      },
    ];
  });
}
