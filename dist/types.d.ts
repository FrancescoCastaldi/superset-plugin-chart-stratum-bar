import { ChartProps, QueryFormData, DataRecord } from '@superset-ui/core';
export type ViewMode = '2d' | '3d';
export type OrientationType = 'vertical' | 'horizontal';
export type StackingMode = 'none' | 'stack' | 'expand';
export type BarShape3D = 'prism' | 'cylinder';
export type BenchmarkType = 'fixed_value' | 'average' | 'median' | 'target_metric';
export type DeltaPolarity = 'normal' | 'inverted';
export interface StratumBarSeriesItem {
    category: string;
    value: number | null;
    formattedValue?: string;
    targetValue?: number | null;
    deltaPercent?: number | null;
    rawData?: DataRecord;
}
export interface StratumBarSeries {
    name: string;
    key: string;
    color?: string;
    data: (number | null)[];
    items: StratumBarSeriesItem[];
    yAxisIndex?: number;
    seriesType?: 'bar' | 'line';
}
export interface BenchmarkConfig {
    value: number;
    label: string;
}
export interface StratumBarFormData extends QueryFormData {
    x_axis?: string;
    groupby?: string[];
    metrics: any;
    target_metric?: any;
    secondary_metrics?: any;
    secondary_series_type?: 'line' | 'bar';
    y_axis_2_title?: string;
    y_axis_2_format?: string;
    combine_category_breakdown?: boolean;
    viewMode?: ViewMode;
    orientation?: OrientationType;
    stacking?: StackingMode;
    barShape3D?: BarShape3D;
    depth3D?: number;
    tilt3D?: number;
    shadow3D?: boolean;
    barBorderRadius?: number;
    showTrackBackground?: boolean;
    showBenchmark?: boolean;
    benchmarkType?: BenchmarkType;
    benchmarkValue?: number;
    showDeltaBadge?: boolean;
    deltaPolarity?: DeltaPolarity;
    showValue?: boolean;
    valuePosition?: 'inside' | 'top' | 'outside';
    numberFormat?: string;
    color_scheme?: string;
    show_legend?: boolean;
    legendOrientation?: 'top' | 'bottom' | 'left' | 'right';
    emit_filter?: boolean;
    enableToolbar?: boolean;
    y_axis_title?: string;
    x_axis_title?: string;
    secondary_area_gradient?: boolean;
    secondary_line_width?: number;
    secondary_line_color?: string;
    theme_mode?: 'light' | 'dark' | 'auto';
    enable_a11y_decal?: boolean;
}
export interface StratumBarTransformedProps {
    width: number;
    height: number;
    categories: string[];
    series: StratumBarSeries[];
    benchmark?: BenchmarkConfig;
    viewMode: ViewMode;
    orientation: OrientationType;
    stacking: StackingMode;
    barShape3D: BarShape3D;
    depth3D: number;
    tilt3D: number;
    shadow3D: boolean;
    barBorderRadius: number;
    showTrackBackground: boolean;
    showBenchmark: boolean;
    showDeltaBadge: boolean;
    deltaPolarity: DeltaPolarity;
    showValue: boolean;
    valuePosition: 'inside' | 'top' | 'outside';
    numberFormat: string;
    colorScheme: string[];
    showLegend: boolean;
    legendOrientation: 'top' | 'bottom' | 'left' | 'right';
    emitFilter: boolean;
    enableToolbar: boolean;
    xAxisTitle?: string;
    yAxisTitle?: string;
    hasDualYAxis?: boolean;
    yAxis2Title?: string;
    yAxis2Format?: string;
    secondaryAreaGradient?: boolean;
    secondaryLineWidth?: number;
    secondaryLineColor?: string;
    themeMode?: 'light' | 'dark' | 'auto';
    enableA11yDecal?: boolean;
    formData: StratumBarFormData;
    onCrossFilter?: (category: string, seriesName?: string) => void;
}
export type StratumBarChartProps = ChartProps & {
    formData: StratumBarFormData;
    hooks?: {
        setDataMask?: (dataMask: any) => void;
        onAddFilter?: (filter: any) => void;
    };
};
//# sourceMappingURL=types.d.ts.map