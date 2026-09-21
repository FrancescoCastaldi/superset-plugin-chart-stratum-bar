import { StratumBarSeries } from '../types';

export function getCategoryAxisConfig(categories: string[], isVertical: boolean, isDark: boolean, axisTitle?: string) {
  return {
    type: 'category' as const,
    data: categories,
    axisLabel: {
      color: isDark ? '#cbd5e1' : '#4b5563',
      fontSize: 12,
      interval: 0,
      rotate: categories.some(c => c.length > 12) && isVertical ? 25 : 0,
    },
    axisLine: { lineStyle: { color: isDark ? '#334155' : '#9ca3af', width: 2 } },
    axisTick: { show: false },
    name: axisTitle,
    nameLocation: 'end' as const,
    nameTextStyle: { color: isDark ? '#94a3b8' : '#6b7280', fontSize: 12, padding: [0, 0, 0, 8] },
  };
}

export function getValueAxisConfig(isVertical: boolean, isDark: boolean, axisTitle?: string) {
  return {
    type: 'value' as const,
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
