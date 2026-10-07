/** Minimum on-screen length (px) of a non-zero 3D bar, so tiny values never collapse into flat wafers. */
export const MIN_BAR_LENGTH_3D = 6;
/** Thickness (px) of the pedestal plinth drawn under each category. */
export const PEDESTAL_PLINTH_SIZE = 5;
/** Number of segments used to approximate the half-ellipse rim of cylinder bodies. */
const CYLINDER_RIM_STEPS = 12;
/** Depth extrusion vector of the isometric projection, rounded to whole pixels. */
export function getIsometricOffsets(depth3D, tilt3D) {
    const tiltRad = (tilt3D * Math.PI) / 180;
    return {
        offsetX: Math.round(depth3D * Math.cos(tiltRad)),
        offsetY: Math.round(depth3D * Math.sin(tiltRad)),
    };
}
export function getEllipsePoints(cx, cy, rx, ry, count = 24) {
    const pts = [];
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * 2 * Math.PI;
        pts.push([cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)]);
    }
    return pts;
}
/** Thickness of a stacked 3D bar given the category band size. */
export function getStackedBarThickness(bandSize) {
    return Math.min(Math.max(bandSize * 0.45, 14), 48);
}
/** Thickness and centre offset of one bar inside a grouped (side-by-side) 3D category slot. */
export function getGroupedBarSlot(bandSize, numSeries, seriesIdx) {
    const maxGroupSize = Math.min(bandSize * 0.75, 140);
    const thickness = Math.min(Math.max(maxGroupSize / numSeries - 3, 6), 40);
    const gap = numSeries > 1 ? 2 : 0;
    const groupOffset = (seriesIdx - (numSeries - 1) / 2) * (thickness + gap);
    return { thickness, groupOffset };
}
/**
 * Front-face rectangle of a 3D bar, including the minimum-length enforcement
 * applied along the value axis.
 */
export function computeBarRect3D(input) {
    const { isVertical, isStacked, categoryIndex, val, baseVal, seriesIdx, numSeries, bandSize, coord } = input;
    let x0;
    let x1;
    let yTop;
    let yBase;
    if (isVertical) {
        if (isStacked) {
            const barWidth = getStackedBarThickness(bandSize);
            const startPoint = coord([categoryIndex, 0]);
            const ptBase = coord([categoryIndex, baseVal]);
            const ptTop = coord([categoryIndex, baseVal + val]);
            x0 = startPoint[0] - barWidth / 2;
            x1 = startPoint[0] + barWidth / 2;
            yBase = ptBase[1];
            yTop = ptTop[1];
        }
        else {
            const { thickness: barWidth, groupOffset } = getGroupedBarSlot(bandSize, numSeries, seriesIdx);
            const pt = coord([categoryIndex, val]);
            const ptBase = coord([categoryIndex, 0]);
            x0 = pt[0] + groupOffset - barWidth / 2;
            x1 = pt[0] + groupOffset + barWidth / 2;
            yTop = pt[1];
            yBase = ptBase[1];
        }
        if (val > 0 && yBase - yTop < MIN_BAR_LENGTH_3D) {
            yTop = yBase - MIN_BAR_LENGTH_3D;
        }
        else if (val < 0 && yTop - yBase < MIN_BAR_LENGTH_3D) {
            yTop = yBase + MIN_BAR_LENGTH_3D;
        }
    }
    else {
        if (isStacked) {
            const barHeight = getStackedBarThickness(bandSize);
            const startPoint = coord([0, categoryIndex]);
            const ptBase = coord([baseVal, categoryIndex]);
            const ptEnd = coord([baseVal + val, categoryIndex]);
            yTop = startPoint[1] - barHeight / 2;
            yBase = startPoint[1] + barHeight / 2;
            x0 = ptBase[0];
            x1 = ptEnd[0];
        }
        else {
            const { thickness: barHeight, groupOffset } = getGroupedBarSlot(bandSize, numSeries, seriesIdx);
            const pt = coord([val, categoryIndex]);
            const ptBase = coord([0, categoryIndex]);
            yTop = pt[1] + groupOffset - barHeight / 2;
            yBase = pt[1] + groupOffset + barHeight / 2;
            x0 = ptBase[0];
            x1 = pt[0];
        }
        if (val > 0 && x1 - x0 < MIN_BAR_LENGTH_3D) {
            x1 = x0 + MIN_BAR_LENGTH_3D;
        }
        else if (val < 0 && x0 - x1 < MIN_BAR_LENGTH_3D) {
            x1 = x0 - MIN_BAR_LENGTH_3D;
        }
    }
    return { x0, x1, yTop, yBase };
}
/** Width (vertical) or height (horizontal) of the pedestal drawn under a category. */
export function getPedestalSize(bandSize, isStacked) {
    return isStacked
        ? Math.min(Math.max(bandSize * 0.55, 28), 70)
        : Math.min(Math.max(bandSize * 0.85, 40), 160);
}
export function getVerticalPedestalPoints(startPt, pedW, { offsetX, offsetY }, plinthH = PEDESTAL_PLINTH_SIZE) {
    const pedX0 = startPt[0] - pedW / 2;
    const pedX1 = startPt[0] + pedW / 2;
    const pedYBase = startPt[1];
    return {
        top: [
            [pedX0, pedYBase],
            [pedX1, pedYBase],
            [pedX1 + offsetX, pedYBase - offsetY],
            [pedX0 + offsetX, pedYBase - offsetY],
        ],
        front: [
            [pedX0, pedYBase],
            [pedX1, pedYBase],
            [pedX1, pedYBase + plinthH],
            [pedX0, pedYBase + plinthH],
        ],
        side: [
            [pedX1, pedYBase],
            [pedX1 + offsetX, pedYBase - offsetY],
            [pedX1 + offsetX, pedYBase - offsetY + plinthH],
            [pedX1, pedYBase + plinthH],
        ],
    };
}
export function getHorizontalPedestalPoints(startPt, pedH, { offsetX, offsetY }, plinthW = PEDESTAL_PLINTH_SIZE) {
    const pedY0 = startPt[1] - pedH / 2;
    const pedY1 = startPt[1] + pedH / 2;
    const pedXBase = startPt[0];
    return {
        plinth: [
            [pedXBase - plinthW, pedY0],
            [pedXBase, pedY0],
            [pedXBase, pedY1],
            [pedXBase - plinthW, pedY1],
        ],
        top: [
            [pedXBase - plinthW, pedY0],
            [pedXBase, pedY0],
            [pedXBase + offsetX, pedY0 - offsetY],
            [pedXBase - plinthW + offsetX, pedY0 - offsetY],
        ],
    };
}
/** Dashed footprint drawn in place of a zero-value grouped bar (half-depth extrusion). */
export function getZeroFootprintPoints({ x0, x1, yTop, yBase }, isVertical, { offsetX, offsetY }) {
    return isVertical
        ? [
            [x0, yBase],
            [x1, yBase],
            [x1 + offsetX * 0.5, yBase - offsetY * 0.5],
            [x0 + offsetX * 0.5, yBase - offsetY * 0.5],
        ]
        : [
            [x0, yTop],
            [x0 + offsetX * 0.5, yTop - offsetY * 0.5],
            [x0 + offsetX * 0.5, yBase - offsetY * 0.5],
            [x0, yBase],
        ];
}
export function getPrismFacePoints({ x0, x1, yTop, yBase }, { offsetX, offsetY }) {
    return {
        shadow: [
            [x0 + 1, yBase + 1],
            [x1 + 1, yBase + 1],
            [x1 + offsetX * 0.7, yBase - offsetY * 0.35 + 1],
            [x0 + offsetX * 0.7, yBase - offsetY * 0.35 + 1],
        ],
        front: [
            [x0, yTop],
            [x1, yTop],
            [x1, yBase],
            [x0, yBase],
        ],
        side: [
            [x1, yTop],
            [x1 + offsetX, yTop - offsetY],
            [x1 + offsetX, yBase - offsetY],
            [x1, yBase],
        ],
        top: [
            [x0, yTop],
            [x1, yTop],
            [x1 + offsetX, yTop - offsetY],
            [x0 + offsetX, yTop - offsetY],
        ],
    };
}
/**
 * Radius of the elliptical cap of a cylinder along the depth axis (also the
 * distance a value label must keep from the cap).
 */
export function getCylinderCapRadius(offset) {
    return Math.max(offset * 0.7, 5);
}
/** Cap clearance used to place value labels above (vertical) or beyond (horizontal) the bar end. */
export function getCapOffsets(barShape3D, { offsetX, offsetY }) {
    const isCylinder = barShape3D === 'cylinder';
    return {
        topCapOffset: isCylinder ? getCylinderCapRadius(offsetY) : offsetY,
        rightCapOffset: isCylinder ? getCylinderCapRadius(offsetX) : offsetX,
    };
}
export function getVerticalCylinderGeometry({ x0, x1, yTop, yBase }, { offsetX, offsetY }) {
    const barWidth = Math.abs(x1 - x0);
    const cx = (x0 + x1) / 2;
    const rx = barWidth / 2;
    const ry = getCylinderCapRadius(offsetY);
    const body = [
        [x0, yTop],
        [x1, yTop],
        [x1, yBase],
    ];
    for (let step = 0; step <= CYLINDER_RIM_STEPS; step++) {
        const a = (step / CYLINDER_RIM_STEPS) * Math.PI;
        body.push([cx + rx * Math.cos(a), yBase + ry * Math.sin(a)]);
    }
    body.push([x0, yTop]);
    return {
        shadow: getEllipsePoints(cx + offsetX * 0.35, yBase, rx * 1.05, ry * 0.8),
        body,
        cap: getEllipsePoints(cx, yTop, rx, ry),
    };
}
export function getHorizontalCylinderGeometry({ x0, x1, yTop, yBase }, { offsetX }) {
    const barHeight = Math.abs(yBase - yTop);
    const cy = (yTop + yBase) / 2;
    const ry = barHeight / 2;
    const rx = getCylinderCapRadius(offsetX);
    const body = [
        [x0, yTop],
        [x1, yTop],
    ];
    for (let step = 0; step <= CYLINDER_RIM_STEPS; step++) {
        const a = -Math.PI / 2 + (step / CYLINDER_RIM_STEPS) * Math.PI;
        body.push([x1 + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
    body.push([x0, yBase]);
    body.push([x0, yTop]);
    return {
        shadow: [
            [x0, yBase],
            [x1, yBase],
            [x1 + 6, yBase + 4],
            [x0 + 6, yBase + 4],
        ],
        body,
        cap: getEllipsePoints(x1, cy, rx, ry),
    };
}
/** Anchor of the "//" axis-break cut mark drawn across a capped bar. */
export function getAxisBreakMarkPosition({ x0, x1, yTop, yBase }, isVertical) {
    return isVertical
        ? { x: (x0 + x1) / 2, y: yTop + 8 }
        : { x: x1 - 8, y: (yTop + yBase) / 2 };
}
/** Stacked segments too small to host a readable label. */
export function isTinySegment({ x0, x1, yTop, yBase }, isVertical) {
    return isVertical ? Math.abs(yBase - yTop) < 14 : Math.abs(x1 - x0) < 20;
}
export function compute3DLabelPlacement(input) {
    const { valuePosition, isVertical, isTopSegment, rect, offsets, topCapOffset, rightCapOffset } = input;
    const { x0, x1, yTop, yBase } = rect;
    const { offsetX, offsetY } = offsets;
    const centred = (rotation) => ({
        labelX: (x0 + x1) / 2,
        labelY: (yTop + yBase) / 2,
        textAlign: 'center',
        textVerticalAlign: 'middle',
        rotation,
        isLightText: true,
    });
    if (valuePosition === 'inside') {
        return centred(0);
    }
    if (valuePosition === 'slanted') {
        if (!isTopSegment)
            return centred(Math.PI / 4);
        return isVertical
            ? {
                labelX: (x0 + x1 + offsetX) / 2,
                labelY: yTop - topCapOffset - 6,
                textAlign: 'left',
                textVerticalAlign: 'middle',
                rotation: Math.PI / 4,
                isLightText: false,
            }
            : {
                labelX: x1 + rightCapOffset + 6,
                labelY: (yTop + yBase - offsetY) / 2,
                textAlign: 'left',
                textVerticalAlign: 'middle',
                rotation: -35 * Math.PI / 180,
                isLightText: false,
            };
    }
    // 'top' / 'outside': the outermost segment is always placed beyond the cap.
    if (!isTopSegment)
        return centred(0);
    return isVertical
        ? {
            labelX: (x0 + x1 + offsetX) / 2,
            labelY: yTop - topCapOffset - 8,
            textAlign: 'center',
            textVerticalAlign: 'bottom',
            rotation: 0,
            isLightText: false,
        }
        : {
            labelX: x1 + rightCapOffset + 8,
            labelY: (yTop + yBase - offsetY) / 2,
            textAlign: 'left',
            textVerticalAlign: 'middle',
            rotation: 0,
            isLightText: false,
        };
}
//# sourceMappingURL=isometricGeometry.js.map