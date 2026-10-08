import { StratumBarSeries } from '../types';

export function getCategoryAxisConfig(categories: string[], isVertical: boolean, isDark: boolean, axisTitle?: string) {
  return {
    type: 'category' as const,
    data: categories,
    inverse: !isVertical,
    axisLabel: {
      color: isDark ? '#cbd5e1' : '#4b5563',
      fontSize: 12,
      interval: 0,
      margin: 10,
      rotate: categories.some(c => c.length > 12) && isVertical ? 25 : 0,
    },
    axisLine: { lineStyle: { color: isDark ? '#334155' : '#cbd5e1', width: 1 } },
    axisTick: { show: false },
    name: axisTitle,
    nameLocation: 'end' as const,
    nameTextStyle: { color: isDark ? '#94a3b8' : '#6b7280', fontSize: 12, padding: [0, 0, 0, 8] },
  };
}

export function getValueAxisConfig(
  _isVertical: boolean,
  isDark: boolean,
  axisTitle?: string,
  maxVal?: number,
  minVal?: number,
) {
  return {
    type: 'value' as const,
    max: maxVal !== undefined && maxVal > 0 ? maxVal : undefined,
    min: minVal !== undefined && minVal < 0 ? minVal : undefined,
    axisLabel: {
      color: isDark ? '#94a3b8' : '#6b7280',
      fontSize: 11,
      formatter: (val: number) => {
        if (Math.abs(val) >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
        if (Math.abs(val) >= 1_000) return (val / 1_000).toFixed(1) + 'k';
        return String(val);
      },
    },
    splitLine: { lineStyle: { color: isDark ? '#1e293b' : '#e5e7eb', type: 'dashed' as const } },
    name: axisTitle,
    nameTextStyle: { color: isDark ? '#94a3b8' : '#6b7280', fontSize: 12, padding: [0, 8, 0, 0] },
  };
}

export function getSecondaryValueAxisConfig(
  isVertical: boolean,
  secondaryLineColor: string,
  yAxis2Format?: string,
  yAxis2Title?: string
) {
  return {
    type: 'value' as const,
    position: isVertical ? ('right' as const) : ('top' as const),
    axisLabel: {
      color: secondaryLineColor,
      fontWeight: 600,
      fontSize: 11,
      formatter: (val: number) => {
        if (yAxis2Format === '.2%') {
          return `${(val * 100).toFixed(1)}%`;
        }
        if (Math.abs(val) >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
        if (Math.abs(val) >= 1_000) return (val / 1_000).toFixed(1) + 'k';
        return Number(val.toFixed(2)).toLocaleString('it-IT');
      },
    },
    splitLine: { show: false },
    name: yAxis2Title || '',
    nameTextStyle: { color: secondaryLineColor, fontWeight: 700, fontSize: 12, padding: [0, 0, 0, 8] },
  };
}

export function getLegendConfig(
  series: StratumBarSeries[],
  colorScheme: string[],
  showLegend: boolean,
  legendOrientation: string,
  isDark: boolean
) {
  const legendData = series
    .filter(s => s.seriesType !== 'line' || series.length === 1)
    .map(s => ({
      name: s.name,
      itemStyle: { color: s.color || colorScheme[series.indexOf(s) % colorScheme.length] || '#3b82f6' },
    }));

  return {
    show: showLegend && series.length > 1,
    orient: (legendOrientation === 'left' || legendOrientation === 'right') ? ('vertical' as const) : ('horizontal' as const),
    top: legendOrientation === 'top' ? 8 : legendOrientation === 'bottom' ? 'bottom' : 'middle',
    left: legendOrientation === 'left' ? 8 : legendOrientation === 'right' ? 'right' : 'center',
    textStyle: { color: isDark ? '#cbd5e1' : '#374151', fontSize: 12, fontWeight: 500 },
    data: legendData,
  };
}

export function getTooltipFormatter(
  categories: string[],
  isDark: boolean,
  colorScheme: string[],
  showBenchmark: boolean,
  benchmark: any,
  yAxis2Title?: string,
  yAxis2Format?: string,
  secondaryLineColor?: string,
  is3D: boolean = false,
  isVertical: boolean = true,
) {
  return (params: any) => {
    const items = Array.isArray(params) ? params : [params];
    if (items.length === 0) return '';
    
    // params[0].axisValueLabel is available in 2D, fallback to categories in 3D
    const catName = items[0].axisValueLabel || categories[items[0].dataIndex] || items[0].name;

    let html = `<div style="font-weight: 700; margin-bottom: 8px; font-size: 14px; color: ${isDark ? '#f8fafc' : '#111827'};">${catName}${is3D ? ' <span style="font-size: 10px; color: #38bdf8; margin-left: 4px;">[3D View]</span>' : ''}</div>`;

    items.forEach(it => {
      if (it.seriesName === '__track_bg__') return;
      // If data object carries originalVal (from Axis Break capping), use it for tooltip accuracy
      const rawData = it.data;
      let val = rawData && typeof rawData === 'object' && rawData.originalVal !== undefined
        ? rawData.originalVal
        : it.value;

      if (Array.isArray(val)) {
        val = is3D ? (isVertical ? val[1] : val[0]) : (val[1] ?? val[0]);
      }
      const isSec = it.seriesName === yAxis2Title || (it.seriesIndex != null && it.seriesIndex === items.length - 1 && secondaryLineColor !== undefined) || it.seriesType === 'line';
      const formatted = yAxis2Format === '.2%' && isSec && typeof val === 'number'
        ? `${(val * 100).toFixed(1)}%`
        : (typeof val === 'number' ? val.toLocaleString('it-IT') : (val !== null && val !== undefined ? String(val) : (is3D ? '-' : 'N/D')));
      
      const defaultColor = colorScheme[(it.seriesIndex || 0) % colorScheme.length] || '#38bdf8';
      const color = isSec && secondaryLineColor ? secondaryLineColor : (it.color && typeof it.color === 'string' ? it.color : (it.color?.colorStops?.[0]?.color || defaultColor));

      html += `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 18px; margin: 4px 0; font-size: 12px;">
          <span style="display: flex; align-items: center; gap: 7px;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: ${it.seriesType === 'line' || isSec ? '50%' : '2px'}; background: ${color};"></span>
            <span style="font-weight: 500;">${it.seriesName}</span>
          </span>
          <span style="font-weight: 700; font-variant-numeric: tabular-nums; color: ${isSec && secondaryLineColor ? secondaryLineColor : 'inherit'};">${formatted}</span>
        </div>
      `;

      if (showBenchmark && benchmark && typeof benchmark.value === 'number' && typeof val === 'number' && (it.seriesIndex === 0 || !isSec)) {
        const delta = val - benchmark.value;
        const deltaPct = benchmark.value !== 0 ? (delta / benchmark.value) * 100 : 0;
        const isPositive = delta >= 0;
        const badgeColor = isPositive ? '#10b981' : '#ef4444';
        const sign = isPositive ? '+' : '';
        html += `
          <div style="font-size: 11px; color: ${badgeColor}; text-align: right; margin-top: 2px;">
            vs Target: <strong>${sign}${deltaPct.toFixed(1)}%</strong> (${sign}${delta.toLocaleString('it-IT')})
          </div>
        `;
      }
    });

    return html;
  };
}

export function getTooltipConfig(isDark: boolean, formatterFn: (params: any) => string) {
  return {
    trigger: 'axis' as const,
    axisPointer: { type: 'cross' as const, crossStyle: { color: isDark ? '#475569' : '#94a3b8', width: 1, type: 'dashed' as const } },
    backgroundColor: isDark ? 'rgba(17, 24, 39, 0.94)' : 'rgba(255, 255, 255, 0.96)',
    borderColor: isDark ? '#374151' : '#e2e8f0',
    borderWidth: 1,
    padding: [12, 16],
    textStyle: { color: isDark ? '#f8fafc' : '#1f2937', fontSize: 13 },
    extraCssText: isDark
      ? 'backdrop-filter: blur(8px); box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.5); border-radius: 10px;'
      : 'backdrop-filter: blur(8px); box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.12); border-radius: 10px;',
    formatter: formatterFn,
  };
}

export function getGridConfig(isVertical: boolean, hasDualYAxis: boolean, legendOrientation: string) {
  const rightPadding = !isVertical
    ? (hasDualYAxis ? 90 : 60)
    : (hasDualYAxis ? 70 : 48);

  return {
    top: legendOrientation === 'top' ? 48 : 36,
    bottom: legendOrientation === 'bottom' ? 48 : 40,
    left: isVertical ? 65 : 110,
    right: rightPadding,
    containLabel: true,
  };
}
