import { ComparisonInfo, StratumBarSeries } from '../types';
import { TimeFormatOptions } from './timeValues';
export declare function getCategoryAxisConfig(categories: string[], isVertical: boolean, isDark: boolean, axisTitle?: string): {
    type: "category";
    data: string[];
    inverse: boolean;
    axisLabel: {
        color: string;
        fontSize: number;
        interval: number;
        margin: number;
        rotate: number;
    };
    axisLine: {
        lineStyle: {
            color: string;
            width: number;
        };
    };
    axisTick: {
        show: boolean;
    };
    name: string | undefined;
    nameLocation: "middle";
    nameGap: number;
    nameTextStyle: {
        color: string;
        fontSize: number;
        fontWeight: number;
        padding: number[];
    };
};
export declare function getValueAxisConfig(_isVertical: boolean, isDark: boolean, axisTitle?: string, maxVal?: number, minVal?: number, 
/** Set when the bars are Time fields: the axis shows durations on round ticks */
timeFormat?: TimeFormatOptions): {
    axisLabel: {
        color: string;
        fontSize: number;
        formatter: (value: number) => string;
    };
    splitLine: {
        lineStyle: {
            color: string;
            type: "dashed";
        };
    };
    name: string | undefined;
    nameTextStyle: {
        color: string;
        fontSize: number;
        fontWeight: number;
        padding: number[];
    };
    interval?: number | undefined;
    type: "value";
    max: number | undefined;
    min: number | undefined;
};
export declare function getSecondaryValueAxisConfig(isVertical: boolean, secondaryLineColor: string, yAxis2Format?: string, yAxis2Title?: string, 
/** Set when the secondary series are Time fields: the axis shows durations on round ticks */
timeFormat?: TimeFormatOptions, timeMax?: number): {
    axisLabel: {
        color: string;
        fontWeight: number;
        fontSize: number;
        formatter: (value: number) => string;
    };
    splitLine: {
        show: boolean;
    };
    name: string;
    nameTextStyle: {
        color: string;
        fontWeight: number;
        fontSize: number;
        padding: number[];
    };
    interval?: number | undefined;
    type: "value";
    position: "top" | "right";
};
export declare function getLegendConfig(series: StratumBarSeries[], colorScheme: string[], showLegend: boolean, legendOrientation: string, isDark: boolean): {
    show: boolean;
    orient: "vertical" | "horizontal";
    top: string | number;
    left: string | number;
    textStyle: {
        color: string;
        fontSize: number;
        fontWeight: number;
    };
    data: {
        name: string;
        icon: string | undefined;
        itemStyle: {
            color: string;
        };
    }[];
};
export declare function getTooltipFormatter(categories: string[], isDark: boolean, colorScheme: string[], showBenchmark: boolean, benchmark: any, yAxis2Title?: string, yAxis2Format?: string, secondaryLineColor?: string, is3D?: boolean, isVertical?: boolean, comparison?: ComparisonInfo, 
/** Series of Time fields: their values are written as durations */
time?: {
    options: TimeFormatOptions;
    seriesNames: string[];
}, 
/** Deviation from the threshold in the tooltip: shown or not, and which direction is good news */
benchmarkDelta?: {
    show: boolean;
    polarity: 'normal' | 'inverted';
}): (params: any) => string;
export declare function getTooltipConfig(isDark: boolean, formatterFn: (params: any) => string): {
    trigger: "axis";
    axisPointer: {
        type: "cross";
        crossStyle: {
            color: string;
            width: number;
            type: "dashed";
        };
    };
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    padding: number[];
    textStyle: {
        color: string;
        fontSize: number;
    };
    extraCssText: string;
    formatter: (params: any) => string;
};
export declare function getGridConfig(isVertical: boolean, hasDualYAxis: boolean, legendOrientation: string): {
    top: number;
    bottom: number;
    left: number;
    right: number;
    containLabel: boolean;
};
//# sourceMappingURL=echartsUtils.d.ts.map