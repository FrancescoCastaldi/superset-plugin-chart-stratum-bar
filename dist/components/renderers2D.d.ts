import { StackingMode, StratumBarTransformedProps, ValuePosition } from '../types';
/**
 * Formats a 2D bar label from the original (pre axis-break) value. In stacked
 * mode near-zero segments (< 1.5% of the axis max) are hidden to avoid clutter.
 */
export declare function format2DBarLabel(params: any, options: {
    stacking: StackingMode;
    effectiveMaxVal?: number;
    numberFormat?: string;
}): string;
/** ECharts label config of 2D bars for the given value position (stacked bars always label inside). */
export declare function get2DBarLabelConfig(options: {
    showValue: boolean;
    valuePosition: ValuePosition;
    stacking: StackingMode;
    isVertical: boolean;
    isDark: boolean;
    formatter: (params: any) => string;
}): {
    show: boolean;
    position: string;
    rotate: number;
    align: string;
    verticalAlign: string;
    distance: number;
    color: string;
    textBorderColor: string;
    textBorderWidth: number;
    fontWeight: number;
    fontSize: number;
    minMargin: number;
    formatter: (params: any) => string;
};
export declare function get2DBarOption(props: StratumBarTransformedProps): {
    backgroundColor: string;
    animationDuration: number;
    aria: {
        enabled: boolean;
        decal: {
            show: boolean;
        };
    };
    grid: {
        top: number;
        bottom: number;
        left: number;
        right: number;
        containLabel: boolean;
    };
    tooltip: {
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
    legend: {
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
    xAxis: {
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
        nameLocation: "end";
        nameTextStyle: {
            color: string;
            fontSize: number;
            padding: number[];
        };
    } | {
        type: "value";
        max: number | undefined;
        min: number | undefined;
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
    } | ({
        type: "value";
        max: number | undefined;
        min: number | undefined;
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
    } | {
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
    })[];
    yAxis: {
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
        nameLocation: "end";
        nameTextStyle: {
            color: string;
            fontSize: number;
            padding: number[];
        };
    } | {
        type: "value";
        max: number | undefined;
        min: number | undefined;
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
    } | ({
        type: "value";
        max: number | undefined;
        min: number | undefined;
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
    } | {
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
    })[];
    series: any[];
};
//# sourceMappingURL=renderers2D.d.ts.map