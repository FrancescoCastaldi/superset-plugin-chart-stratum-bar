export interface CrossFilterOptions {
  emit_filter: boolean;
  actualBreakdownKey?: string;
  primaryMetric: string;
  currentSelected: string[];
  actualXKey: string;
  setDataMask: any;
  onAddFilter: any;
}

export function buildCrossFilterHandler(options: CrossFilterOptions) {
  const { emit_filter, actualBreakdownKey, primaryMetric, currentSelected, actualXKey, setDataMask, onAddFilter } = options;

  return (category: string, seriesName?: string) => {
    if (!emit_filter) return;

    const filterKey = seriesName && actualBreakdownKey && seriesName !== primaryMetric
      ? `${category} · ${seriesName}`
      : category;

    const isAlreadySelected = currentSelected.includes(filterKey) || currentSelected.includes(category);

    if (isAlreadySelected) {
      if (typeof setDataMask === 'function') {
        setDataMask({
          extraFormData: { filters: [] },
          filterState: { value: null, selectedValues: null },
        });
      }
      return;
    }

    const filters: any[] = [];
    if (category.includes(' · ') && actualBreakdownKey) {
      const parts = category.split(' · ');
      filters.push({ col: actualXKey, op: 'IN', val: [parts[0].trim()] });
      filters.push({ col: actualBreakdownKey, op: 'IN', val: [parts[1].trim()] });
    } else {
      filters.push({ col: actualXKey, op: 'IN', val: [category] });
      if (seriesName && actualBreakdownKey && seriesName !== primaryMetric) {
        filters.push({ col: actualBreakdownKey, op: 'IN', val: [seriesName] });
      }
    }

    if (typeof setDataMask === 'function') {
      setDataMask({
        extraFormData: { filters },
        filterState: {
          value: filters.map(f => f.val),
          selectedValues: [filterKey, category],
        },
      });
    } else if (typeof onAddFilter === 'function') {
      filters.forEach(f => onAddFilter(f));
    }
  };
}
