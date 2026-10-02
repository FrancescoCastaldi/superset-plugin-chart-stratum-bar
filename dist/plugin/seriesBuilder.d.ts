import { DataRecord } from '@superset-ui/core';
import { StratumBarSeries } from '../types';
export interface BuildRepresentationOptions {
    data: DataRecord[];
    isPivoted: boolean;
    actualXKey: string;
    actualBreakdownKey?: string;
    actualMetricKey: string;
    targetMetricKey?: string;
    primaryMetric: string;
    metricList: string[];
    secondaryMetricList: string[];
    y_axis_2_format: string;
    getColor: (key: string, idx: number) => string;
    palette: string[];
    formatter: (v: number) => string;
    resolvedXAxis: string;
    secFormatter: (v: number) => string;
    secondary_line_color: string;
    secondary_series_type: string;
    secPalette: string[];
    combineFlag: boolean;
    sampleRow: any;
    potentialPivotedKeys: string[];
    sortBy?: 'original' | 'category' | 'metric';
    isOrderDesc?: boolean;
}
export declare function buildSeriesRepresentation(options: BuildRepresentationOptions): {
    categories: string[];
    series: StratumBarSeries[];
};
//# sourceMappingURL=seriesBuilder.d.ts.map