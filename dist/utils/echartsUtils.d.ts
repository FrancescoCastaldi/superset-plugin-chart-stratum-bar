import { StratumBarSeries } from '../types';
export declare function getCategoryAxisConfig(categories: string[], isVertical: boolean, isDark: boolean, axisTitle?: string): {
    type: "category";
    data: string[];
    axisLabel: {
        color: string;
        fontSize: number;
        interval: number;
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
    nameLocation: "end";
    nameTextStyle: {
        color: string;
        fontSize: number;
        padding: number[];
    };
};
export declare function getValueAxisConfig(isVertical: boolean, isDark: boolean, axisTitle?: string): {
    type: "value";
    axisLabel: {
        color: string;
        fontSize: number;
        formatter: (val: number) => string;
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
        padding: number[];
    };
};
export declare function getSecondaryValueAxisConfig(isVertical: boolean, secondaryLineColor: string, yAxis2Format?: string, yAxis2Title?: string): {
    type: "value";
    position: "top" | "right";
    axisLabel: {
        color: string;
        fontWeight: number;
        fontSize: number;
        formatter: (val: number) => string;
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
        itemStyle: {
            color: string;
        };
    }[];
};
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