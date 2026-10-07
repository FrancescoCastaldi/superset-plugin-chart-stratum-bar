import { BarShape3D, ValuePosition } from '../types';
export type Point = [number, number];
/** Pixel rectangle of the front face of a 3D bar (screen coordinates, y grows downwards). */
export interface BarRect {
    x0: number;
    x1: number;
    yTop: number;
    yBase: number;
}
export interface IsometricOffsets {
    offsetX: number;
    offsetY: number;
}
/** Minimum on-screen length (px) of a non-zero 3D bar, so tiny values never collapse into flat wafers. */
export declare const MIN_BAR_LENGTH_3D = 6;
/** Thickness (px) of the pedestal plinth drawn under each category. */
export declare const PEDESTAL_PLINTH_SIZE = 5;
/** Depth extrusion vector of the isometric projection, rounded to whole pixels. */
export declare function getIsometricOffsets(depth3D: number, tilt3D: number): IsometricOffsets;
export declare function getEllipsePoints(cx: number, cy: number, rx: number, ry: number, count?: number): Point[];
/** Thickness of a stacked 3D bar given the category band size. */
export declare function getStackedBarThickness(bandSize: number): number;
/** Thickness and centre offset of one bar inside a grouped (side-by-side) 3D category slot. */
export declare function getGroupedBarSlot(bandSize: number, numSeries: number, seriesIdx: number): {
    thickness: number;
    groupOffset: number;
};
export interface BarRectInput {
    isVertical: boolean;
    isStacked: boolean;
    categoryIndex: number;
    val: number;
    /** Accumulated value under this segment (stacked mode only). */
    baseVal: number;
    seriesIdx: number;
    numSeries: number;
    /** Size of one category band along the category axis (px). */
    bandSize: number;
    /** ECharts `api.coord`: data point ([x, y] in axis order) to pixel. */
    coord: (point: [number, number]) => number[];
}
/**
 * Front-face rectangle of a 3D bar, including the minimum-length enforcement
 * applied along the value axis.
 */
export declare function computeBarRect3D(input: BarRectInput): BarRect;
/** Width (vertical) or height (horizontal) of the pedestal drawn under a category. */
export declare function getPedestalSize(bandSize: number, isStacked: boolean): number;
export interface VerticalPedestalPoints {
    top: Point[];
    front: Point[];
    side: Point[];
}
export declare function getVerticalPedestalPoints(startPt: number[], pedW: number, { offsetX, offsetY }: IsometricOffsets, plinthH?: number): VerticalPedestalPoints;
export interface HorizontalPedestalPoints {
    plinth: Point[];
    top: Point[];
}
export declare function getHorizontalPedestalPoints(startPt: number[], pedH: number, { offsetX, offsetY }: IsometricOffsets, plinthW?: number): HorizontalPedestalPoints;
/** Dashed footprint drawn in place of a zero-value grouped bar (half-depth extrusion). */
export declare function getZeroFootprintPoints({ x0, x1, yTop, yBase }: BarRect, isVertical: boolean, { offsetX, offsetY }: IsometricOffsets): Point[];
export interface PrismFacePoints {
    shadow: Point[];
    front: Point[];
    side: Point[];
    top: Point[];
}
export declare function getPrismFacePoints({ x0, x1, yTop, yBase }: BarRect, { offsetX, offsetY }: IsometricOffsets): PrismFacePoints;
/**
 * Radius of the elliptical cap of a cylinder along the depth axis (also the
 * distance a value label must keep from the cap).
 */
export declare function getCylinderCapRadius(offset: number): number;
/** Cap clearance used to place value labels above (vertical) or beyond (horizontal) the bar end. */
export declare function getCapOffsets(barShape3D: BarShape3D, { offsetX, offsetY }: IsometricOffsets): {
    topCapOffset: number;
    rightCapOffset: number;
};
export interface CylinderGeometry {
    shadow: Point[];
    body: Point[];
    cap: Point[];
}
export declare function getVerticalCylinderGeometry({ x0, x1, yTop, yBase }: BarRect, { offsetX, offsetY }: IsometricOffsets): CylinderGeometry;
export declare function getHorizontalCylinderGeometry({ x0, x1, yTop, yBase }: BarRect, { offsetX }: IsometricOffsets): CylinderGeometry;
/** Anchor of the "//" axis-break cut mark drawn across a capped bar. */
export declare function getAxisBreakMarkPosition({ x0, x1, yTop, yBase }: BarRect, isVertical: boolean): {
    x: number;
    y: number;
};
/** Stacked segments too small to host a readable label. */
export declare function isTinySegment({ x0, x1, yTop, yBase }: BarRect, isVertical: boolean): boolean;
export interface LabelPlacement3D {
    labelX: number;
    labelY: number;
    textAlign: 'left' | 'center' | 'right';
    textVerticalAlign: 'top' | 'middle' | 'bottom';
    rotation: number;
    isLightText: boolean;
}
export interface LabelPlacementInput {
    valuePosition: ValuePosition;
    isVertical: boolean;
    /** Whether the segment is the outermost one of its column (always true when not stacked). */
    isTopSegment: boolean;
    rect: BarRect;
    offsets: IsometricOffsets;
    topCapOffset: number;
    rightCapOffset: number;
}
export declare function compute3DLabelPlacement(input: LabelPlacementInput): LabelPlacement3D;
//# sourceMappingURL=isometricGeometry.d.ts.map