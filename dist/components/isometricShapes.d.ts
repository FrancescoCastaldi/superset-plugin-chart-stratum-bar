import { BarRect, IsometricOffsets, LabelPlacement3D } from '../utils/isometricGeometry';
/**
 * ECharts graphic elements composing one 3D isometric bar (custom series
 * renderItem children). Geometry lives in utils/isometricGeometry; this module
 * only attaches the theme-aware styles and stacking order (z2).
 */
export interface BarPalette {
    baseColor: string;
    topColor: string;
    rightColor: string;
}
export declare function getBarPalette(baseColor: string): BarPalette;
/** Architectural base drawn once per category (by the first series) under the bars. */
export declare function buildPedestalElements(options: {
    isVertical: boolean;
    isStacked: boolean;
    isDark: boolean;
    startPt: number[];
    bandSize: number;
    offsets: IsometricOffsets;
}): any[];
/** Dashed slot shown instead of a zero-height grouped bar. */
export declare function buildZeroFootprintElement(rect: BarRect, isVertical: boolean, isDark: boolean, offsets: IsometricOffsets): any;
export declare function buildCylinderElements(options: {
    rect: BarRect;
    isVertical: boolean;
    shadow3D: boolean;
    offsets: IsometricOffsets;
    palette: BarPalette;
}): any[];
export declare function buildPrismElements(options: {
    rect: BarRect;
    isVertical: boolean;
    isDark: boolean;
    shadow3D: boolean;
    offsets: IsometricOffsets;
    palette: BarPalette;
}): any[];
export declare function buildValueLabelElement(text: string, placement: LabelPlacement3D, isDark: boolean): any;
/** "//" cut mark drawn across a bar whose value exceeds the axis-break cutoff. */
export declare function buildAxisBreakMarkElement(rect: BarRect, isVertical: boolean): {
    type: string;
    style: {
        text: string;
        x: number;
        y: number;
        textAlign: string;
        textVerticalAlign: string;
        font: string;
        fill: string;
        stroke: string;
        lineWidth: number;
    };
    z2: number;
};
//# sourceMappingURL=isometricShapes.d.ts.map