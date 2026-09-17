import { buildQueryContext, QueryContext, ensureIsArray } from '@superset-ui/core';
import { StratumBarFormData } from '../types';

export default function buildQuery(formData: StratumBarFormData): QueryContext {
  const fd: any = formData || {};
  const {
    x_axis,
    groupby = [],
    metrics = [],
    target_metric,
  } = fd;

  return buildQueryContext(formData as any, (baseQueryObject: any) => {
    // Resolve x_axis dimension or first groupby if x_axis is empty
    const resolvedXAxis = x_axis || ensureIsArray(groupby)[0];
    const breakdownCols = ensureIsArray(groupby).filter(col => col !== resolvedXAxis);

    const columns = [resolvedXAxis, ...breakdownCols].filter(Boolean);

    // Collect all required metrics including optional target_metric
    const resolvedMetrics = [...ensureIsArray(metrics)];
    if (target_metric && !resolvedMetrics.includes(target_metric)) {
      resolvedMetrics.push(target_metric);
    }

    return [
      {
        ...baseQueryObject,
        columns,
        metrics: resolvedMetrics,
      },
    ];
  });
}
