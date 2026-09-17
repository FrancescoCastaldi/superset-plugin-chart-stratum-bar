import { StratumBarTransformedProps } from '../types';
export declare function get3DBarOption(props: StratumBarTransformedProps): {
    animationDuration: number;
    animationEasing: "cubicOut";
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
            type: "shadow";
        };
        backgroundColor: string;
        borderColor: string;
        borderWidth: number;
        padding: number[];
        textStyle: {
            color: string;
            fontSize: number;
        };
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
        };
    };
    xAxis: {
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
        nameTextStyle: {
            color: string;
            fontSize: number;
            padding: number[];
        };
    } | {
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
    yAxis: {
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
        nameTextStyle: {
            color: string;
            fontSize: number;
            padding: number[];
        };
    } | {
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
    series: any[];
};
//# sourceMappingURL=renderers3D.d.ts.map