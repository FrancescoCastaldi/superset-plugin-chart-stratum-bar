import { StratumBarTransformedProps } from '../types';
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
        trigger: 'axis';
        axisPointer: {
            type: 'cross';
            crossStyle: {
                color: string;
                width: number;
                type: 'dashed';
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
        orient: "horizontal" | "vertical";
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
    xAxis: ({
        type: 'value';
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
                type: 'dashed';
            };
        };
        name: string | undefined;
        nameTextStyle: {
            color: string;
            fontSize: number;
            padding: number[];
        };
    } | {
        type: 'value';
        position: "right" | "top";
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
    })[] | {
        type: 'category';
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
        nameLocation: 'end';
        nameTextStyle: {
            color: string;
            fontSize: number;
            padding: number[];
        };
    } | {
        type: 'value';
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
                type: 'dashed';
            };
        };
        name: string | undefined;
        nameTextStyle: {
            color: string;
            fontSize: number;
            padding: number[];
        };
    };
    yAxis: ({
        type: 'value';
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
                type: 'dashed';
            };
        };
        name: string | undefined;
        nameTextStyle: {
            color: string;
            fontSize: number;
            padding: number[];
        };
    } | {
        type: 'value';
        position: "right" | "top";
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
    })[] | {
        type: 'category';
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
        nameLocation: 'end';
        nameTextStyle: {
            color: string;
            fontSize: number;
            padding: number[];
        };
    } | {
        type: 'value';
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
                type: 'dashed';
            };
        };
        name: string | undefined;
        nameTextStyle: {
            color: string;
            fontSize: number;
            padding: number[];
        };
    };
    series: any[];
};
//# sourceMappingURL=renderers2D.d.ts.map