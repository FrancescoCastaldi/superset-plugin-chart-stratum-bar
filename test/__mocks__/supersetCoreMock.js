module.exports = {
  getNumberFormatter: (format) => (val) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'number') return val.toLocaleString('it-IT');
    return String(val);
  },
  ensureIsArray: (val) => (val ? (Array.isArray(val) ? val : [val]) : []),
  CategoricalColorNamespace: {
    getScale: (scheme) => ({
      colors: [
        '#3b82f6', '#10b981', '#f59e0b', '#ec4899',
        '#8b5cf6', '#06b6d4', '#f97316', '#6366f1'
      ],
    }),
  },
  Behavior: {
    InteractiveChart: 'INTERACTIVE_CHART',
    DrillToDetail: 'DRILL_TO_DETAIL',
  },
  ChartMetadata: function(options) {
    return options;
  },
  ChartPlugin: function(options) {
    return options;
  },
  buildQueryContext: function(formData, buildQueryFn) {
    return buildQueryFn({ formData });
  },
};
