import { buildQueryContext, ensureIsArray } from '@superset-ui/core';
export default function buildQuery(formData) {
    const fd = formData || {};
    const { x_axis, x_axis_group, groupby = [], metrics = [], target_metric, secondary_metrics, } = fd;
    return buildQueryContext(formData, (baseQueryObject) => {
        // Helper to extract column key
        const getDimKey = (col) => {
            if (!col)
                return '';
            if (typeof col === 'string')
                return col;
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
        const seenKeys = new Set();
        const columns = [];
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