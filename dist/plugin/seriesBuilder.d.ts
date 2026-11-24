import { DataRecord } from '@superset-ui/core';
import { StratumBarSeries, TimeComparisonMode } from '../types';
import { ChartLocale } from '../utils/comparison';
export interface BuildRepresentationOptions {
    data: DataRecord[];
    isPivoted: boolean;
    actualXKey: string;
    actualBreakdownKey?: string;
    actualMetricKey: string;
    primaryMetric: string;
    metricList: string[];
    secondaryMetricList: string[];
    getColor: (key: string, idx: number) => string;
    palette: string[];
    resolvedXAxis: string;
    secondary_line_color: string;
    secondary_series_type: string;
    secPalette: string[];
    combineFlag: boolean;
    sampleRow: any;
    potentialPivotedKeys: string[];
    sortBy?: 'original' | 'category' | 'metric';
    isOrderDesc?: boolean;
    timeComparisonMode?: TimeComparisonMode;
    comparisonMetric?: any;
    comparisonMetricMap?: Map<string, string>;
    time1Label?: string;
    time2Label?: string;
    /** Language of the default names of the two periods */
    locale?: ChartLocale;
    /** Lowercase names of the metric columns that hold seconds of a Time field */
    timeKeys?: Set<string>;
}
export declare function buildSeriesRepresentation(options: BuildRepresentationOptions): {
    categories: string[];
    series: StratumBarSeries[];
};
//# sourceMappingURL=seriesBuilder.d.ts.map