import { DataRecord } from '@superset-ui/core';
/**
 * Time and duration values.
 *
 * A metric of type Time (SQL Server `time`, a duration, an average waiting time) reaches the chart as a
 * string such as "00:12:54.425000". The chart works on seconds: the columns that hold times are converted
 * to numbers once, in transformProps, and everything after (axis, bars, labels, tooltip, benchmark) formats
 * the seconds back as a duration.
 */
export type TimeDetection = 'auto' | 'off';
export type TimeDisplayFormat = 'auto' | 'hms' | 'ms' | 'minutes' | 'hours' | 'seconds';
export type ValueKind = 'number' | 'time';
export interface TimeFormatOptions {
    format?: TimeDisplayFormat;
    /** Decimals of the seconds in clock formats and of the value in decimal formats */
    fractionDigits?: number;
    /** Largest value of the chart in seconds, used by the automatic format to choose h:mm:ss or mm:ss */
    referenceSeconds?: number;
}
/**
 * Seconds of a time or duration written as text, or null when the text is not one.
 * Accepted: `HH:MM:SS`, `H:MM:SS.ffffff`, `26:10:00` (more than 24 hours), `1 day, 2:03:04`,
 * `0 days 00:12:54.425000` and ISO 8601 durations (`PT12M54S`). Two-part values such as `12:54` are not
 * accepted: they could be hours and minutes or minutes and seconds.
 */
export declare function parseTimeToSeconds(raw: unknown): number | null;
/** True when every non-empty value of the column is a time and there is at least one */
export declare function isTimeColumn(rows: DataRecord[], key: string): boolean;
/** Text of a number of seconds in the chosen display format */
export declare function formatDuration(seconds: number, options?: TimeFormatOptions): string;
/** A round spacing (seconds, minutes, hours) that gives about `targetTicks` ticks up to `max` */
export declare function niceTimeInterval(max: number, targetTicks?: number): number | undefined;
/** Whether the bars (or lines) of an axis are all Time fields, and so the axis shows durations */
export declare function axisTimeOptions(series: {
    yAxisIndex?: number;
    valueKind?: ValueKind;
    seriesType?: string;
}[], secondary: boolean, timeFormat?: TimeFormatOptions): TimeFormatOptions | undefined;
/** Largest value of the series on one axis, in seconds */
export declare function axisDataMax(series: {
    yAxisIndex?: number;
    data: (number | null)[];
}[], secondary: boolean): number;
/** What the tooltip needs to write Time series as durations (undefined when the chart has none) */
export declare function tooltipTimeInfo(series: {
    name: string;
    valueKind?: ValueKind;
}[], timeFormat?: TimeFormatOptions): {
    options: TimeFormatOptions;
    seriesNames: string[];
} | undefined;
/** Tick spacing, top and labels of a value axis that shows durations */
export declare function timeAxisSettings(timeFormat: TimeFormatOptions, max?: number): {
    interval: number | undefined;
    max: number | undefined;
    formatter: (value: number) => string;
};
/** Rows with the time columns among `candidates` converted to seconds, and the names of those columns */
export declare function convertTimeColumns(rows: DataRecord[], candidates: string[]): {
    rows: DataRecord[];
    timeKeys: string[];
};
//# sourceMappingURL=timeValues.d.ts.map