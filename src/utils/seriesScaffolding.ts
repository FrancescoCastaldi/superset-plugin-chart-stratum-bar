import { BenchmarkConfig } from '../types';
import { hexToRgba } from './colors';

/**
 * Building blocks shared by the 2D and 3D renderers' series loops. Each
 * builder returns a fresh object so callers may mutate the result safely.
 */

/** Selection opacity applied to non-selected bars when a cross-filter is active. */
export const UNSELECTED_OPACITY = 0.28;

/**
 * A data point is highlighted when no selection is active, or when the selection
 * contains its category, its series, or the composite `category · series` label.
 */
export function isItemSelected(selectedValues: string[] | undefined, categoryName: string, seriesName: string): boolean {
  const hasSelection = Boolean(selectedValues && selectedValues.length > 0);
  return !hasSelection ||
    selectedValues!.includes(categoryName) ||
    selectedValues!.includes(seriesName) ||
    selectedValues!.includes(`${categoryName} · ${seriesName}`);
}

export function getItemOpacity(isSelected: boolean): number {
  return isSelected ? 1.0 : UNSELECTED_OPACITY;
}

export function formatBenchmarkLabel(benchmark: BenchmarkConfig): string {
  return `${benchmark.label}: ${benchmark.value.toLocaleString('it-IT')}`;
}

export function getBenchmarkLineStyle() {
  return {
    color: '#ef4444',
    type: 'dashed',
    width: 2,
  };
}

export function getBenchmarkLabel(benchmark: BenchmarkConfig, position: 'start' | 'end') {
  return {
    position,
    formatter: formatBenchmarkLabel(benchmark),
    color: '#dc2626',
    fontSize: 11,
    fontWeight: 700,
    backgroundColor: 'rgba(254, 242, 242, 0.92)',
    borderColor: '#fca5a5',
    borderWidth: 1,
    borderRadius: 4,
    padding: [3, 6],
  };
}

/** markLine data item for the dashed "// Taglio Asse" cutoff of an active axis break. */
export function getAxisBreakCutLine(isVertical: boolean, isDark: boolean, cutoff: number) {
  const item: any = isVertical ? { yAxis: cutoff } : { xAxis: cutoff };
  item.lineStyle = {
    color: isDark ? '#a855f7' : '#9333ea',
    type: [4, 4],
    width: 1.5,
  };
  item.label = {
    position: 'insideEndTop',
    formatter: `// Taglio Asse: ${cutoff.toLocaleString('it-IT')}`,
    color: isDark ? '#d8b4fe' : '#7e22ce',
    fontSize: 10,
    fontWeight: 600,
    backgroundColor: isDark ? 'rgba(30, 27, 75, 0.85)' : 'rgba(243, 232, 255, 0.85)',
    borderColor: isDark ? '#6b21a8' : '#d8b4fe',
    borderWidth: 1,
    borderRadius: 3,
    padding: [2, 5],
  };
  return item;
}

export interface SmartAnnotationStyle {
  symbolSize: number;
  fontSize: number;
  /** Alpha of the pin fill (white on dark theme, black on light theme). */
  fillAlpha: number;
  shadowBlur: number;
  shadowAlpha: number;
}

export const SMART_ANNOTATION_STYLE_2D: SmartAnnotationStyle = {
  symbolSize: 40,
  fontSize: 14,
  fillAlpha: 0.15,
  shadowBlur: 6,
  shadowAlpha: 0.2,
};

export const SMART_ANNOTATION_STYLE_3D: SmartAnnotationStyle = {
  symbolSize: 45,
  fontSize: 16,
  fillAlpha: 0.1,
  shadowBlur: 8,
  shadowAlpha: 0.3,
};

export function formatSmartAnnotation(params: any): string {
  return params.type === 'max' ? '🏆' : '📉';
}

/** Max/min pin annotations (markPoint) attached to a bar series. */
export function getSmartAnnotationMarkPoint(baseColor: string, isDark: boolean, style: SmartAnnotationStyle) {
  return {
    symbol: 'pin',
    symbolSize: style.symbolSize,
    label: {
      show: true,
      color: '#fff',
      fontWeight: 'bold',
      formatter: formatSmartAnnotation,
      fontSize: style.fontSize,
    },
    itemStyle: {
      color: isDark ? `rgba(255,255,255,${style.fillAlpha})` : `rgba(0,0,0,${style.fillAlpha})`,
      borderColor: baseColor,
      borderWidth: 2,
      shadowBlur: style.shadowBlur,
      shadowColor: `rgba(0,0,0,${style.shadowAlpha})`,
    },
    data: [
      { type: 'max', name: 'Max' },
      { type: 'min', name: 'Min' },
    ],
  };
}

/** Value label of line series: percentage for `.2%` secondary axes, Italian locale otherwise. */
export function formatLineSeriesValue(value: any, yAxis2Format?: string): string {
  if (value === null || value === undefined) return '';
  if (yAxis2Format === '.2%') {
    return `${(Number(value) * 100).toFixed(1)}%`;
  }
  return typeof value === 'number' ? value.toLocaleString('it-IT') : String(value);
}

export interface LineSeriesOptions {
  name: string;
  data: any[];
  baseColor: string;
  isVertical: boolean;
  yAxisIndex?: number;
  isDark: boolean;
  showValue: boolean;
  yAxis2Format?: string;
  lineWidth: number;
  areaGradient: boolean;
  /** Alpha of the glow under the line stroke. */
  shadowAlpha: number;
  /** Alpha at the top of the area gradient. */
  areaAlpha: number;
  z: number;
}

/** Smooth line series (with optional area gradient) used for secondary metrics. */
export function buildLineSeries(options: LineSeriesOptions) {
  const {
    name, data, baseColor, isVertical, yAxisIndex, isDark, showValue, yAxis2Format,
    lineWidth, areaGradient, shadowAlpha, areaAlpha, z,
  } = options;

  const lineSeriesItem: any = {
    name,
    type: 'line',
    smooth: true,
    symbol: 'circle',
    symbolSize: 8,
    yAxisIndex: isVertical ? (yAxisIndex ?? 0) : 0,
    xAxisIndex: !isVertical ? (yAxisIndex ?? 0) : 0,
    data,
    lineStyle: {
      width: lineWidth,
      color: baseColor,
      shadowColor: hexToRgba(baseColor, shadowAlpha),
      shadowBlur: 8,
      shadowOffsetY: 3,
    },
    itemStyle: {
      color: baseColor,
      borderColor: isDark ? '#111827' : '#ffffff',
      borderWidth: 2.5,
    },
    emphasis: {
      scale: true,
      itemStyle: {
        borderWidth: 3,
        shadowBlur: 10,
        shadowColor: hexToRgba(baseColor, 0.6),
      },
    },
    label: {
      show: showValue,
      position: 'top',
      color: baseColor,
      fontWeight: 700,
      fontSize: 11,
      formatter: (params: any) => formatLineSeriesValue(params.value, yAxis2Format),
    },
    z,
  };

  if (areaGradient) {
    lineSeriesItem.areaStyle = {
      color: {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: hexToRgba(baseColor, areaAlpha) },
          { offset: 1, color: hexToRgba(baseColor, 0.0) },
        ],
      },
    };
  }

  return lineSeriesItem;
}

/**
 * Places category/value axes on x/y according to orientation; with a dual axis
 * the secondary value axis follows the primary one.
 */
export function arrangeAxes<C, V, S>(
  isVertical: boolean,
  hasDualYAxis: boolean | undefined,
  categoryAxis: C,
  valueAxis: V,
  secondaryValueAxis: S,
) {
  const valueAxes = hasDualYAxis ? [valueAxis, secondaryValueAxis] : valueAxis;
  return {
    xAxis: isVertical ? categoryAxis : valueAxes,
    yAxis: isVertical ? valueAxes : categoryAxis,
  };
}
