import { buildQueryContext, ensureIsArray } from '@superset-ui/core';
export default function buildQuery(formData) {
    const fd = formData || {};
    const { x_axis, groupby = [], metrics = [], target_metric, secondary_metrics, } = fd;
    return buildQueryContext(formData, (baseQueryObject) => {
        // Resolve x_axis dimension or first groupby if x_axis is empty
        const resolvedXAxis = x_axis || ensureIsArray(groupby)[0];
        const breakdownCols = ensureIsArray(groupby).filter(col => col !== resolvedXAxis);
        const columns = [resolvedXAxis, ...breakdownCols].filter(Boolean);
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
        return [
            {
                ...baseQueryObject,
                columns,
                metrics: resolvedMetrics,
            },
        ];
    });
}
//# sourceMappingURL=buildQuery.js.map