import { StratumBarSeries, BenchmarkConfig, StratumBarFormData } from '../types';
export declare function resolveColors(fd: StratumBarFormData, rawFd: any, scaleInstance: any): {
    combinedLabelColors: Record<string, string>;
    palette: string[];
    getColor: (key: string, idx: number) => string;
};
export declare function resolveDimensions(fd: StratumBarFormData, sampleRow: Record<string, any>): {
    resolvedXAxis: string;
    actualXKey: string;
    actualBreakdownKey: string | undefined;
    secondaryDimName: string | undefined;
};
export declare function computeBenchmark(series: StratumBarSeries[], showBenchmark: boolean, benchmarkType: string, benchmarkValue: number, formatter: (v: number) => string): BenchmarkConfig | undefined;
//# sourceMappingURL=transformPropsUtils.d.ts.map