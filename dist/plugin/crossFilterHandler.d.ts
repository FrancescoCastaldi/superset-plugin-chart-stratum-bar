export interface CrossFilterOptions {
    emit_filter: boolean;
    actualBreakdownKey?: string;
    primaryMetric: string;
    currentSelected: string[];
    actualXKey: string;
    setDataMask: any;
    onAddFilter: any;
}
export declare function buildCrossFilterHandler(options: CrossFilterOptions): (category: string, seriesName?: string) => void;
//# sourceMappingURL=crossFilterHandler.d.ts.map