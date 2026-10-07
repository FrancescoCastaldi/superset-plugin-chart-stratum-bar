import { adjustColorBrightness } from '../utils/colors';
import { getAxisBreakMarkPosition, getHorizontalCylinderGeometry, getHorizontalPedestalPoints, getPedestalSize, getPrismFacePoints, getVerticalCylinderGeometry, getVerticalPedestalPoints, getZeroFootprintPoints, } from '../utils/isometricGeometry';
export function getBarPalette(baseColor) {
    return {
        baseColor,
        topColor: adjustColorBrightness(baseColor, 35),
        rightColor: adjustColorBrightness(baseColor, -25),
    };
}
function polygon(points, style, z2, silent = false) {
    const el = { type: 'polygon', shape: { points }, style };
    if (silent)
        el.silent = true;
    el.z2 = z2;
    return el;
}
const pedestalTopStyle = (isDark) => ({
    fill: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.95)',
    stroke: isDark ? '#334155' : '#cbd5e1',
    lineWidth: 1,
});
/** Architectural base drawn once per category (by the first series) under the bars. */
export function buildPedestalElements(options) {
    const { isVertical, isStacked, isDark, startPt, bandSize, offsets } = options;
    const size = getPedestalSize(bandSize, isStacked);
    if (isVertical) {
        const pts = getVerticalPedestalPoints(startPt, size, offsets);
        return [
            polygon(pts.top, pedestalTopStyle(isDark), 0, true),
            polygon(pts.front, {
                fill: isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(226, 232, 240, 0.98)',
                stroke: isDark ? '#1e293b' : '#94a3b8',
                lineWidth: 1,
            }, 0, true),
            polygon(pts.side, {
                fill: isDark ? 'rgba(15, 23, 42, 0.98)' : 'rgba(203, 213, 225, 0.98)',
                stroke: isDark ? '#1e293b' : '#94a3b8',
                lineWidth: 1,
            }, 0, true),
        ];
    }
    const pts = getHorizontalPedestalPoints(startPt, size, offsets);
    return [
        polygon(pts.plinth, {
            fill: isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(226, 232, 240, 0.98)',
            stroke: isDark ? '#1e293b' : '#cbd5e1',
            lineWidth: 1,
        }, 0, true),
        polygon(pts.top, pedestalTopStyle(isDark), 0, true),
    ];
}
/** Dashed slot shown instead of a zero-height grouped bar. */
export function buildZeroFootprintElement(rect, isVertical, isDark, offsets) {
    return polygon(getZeroFootprintPoints(rect, isVertical, offsets), {
        fill: isDark ? 'rgba(51, 65, 85, 0.25)' : 'rgba(203, 213, 225, 0.4)',
        stroke: isDark ? 'rgba(100, 116, 139, 0.4)' : 'rgba(148, 163, 184, 0.5)',
        lineWidth: 0.75,
        lineDash: [2, 2],
    }, 1, true);
}
export function buildCylinderElements(options) {
    const { rect, isVertical, shadow3D, offsets, palette } = options;
    const { baseColor, topColor, rightColor } = palette;
    const children = [];
    if (isVertical) {
        const geo = getVerticalCylinderGeometry(rect, offsets);
        if (shadow3D) {
            children.push(polygon(geo.shadow, { fill: 'rgba(0, 0, 0, 0.14)' }, 0, true));
        }
        children.push(polygon(geo.body, {
            fill: {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                    { offset: 0, color: adjustColorBrightness(baseColor, -25) },
                    { offset: 0.28, color: adjustColorBrightness(baseColor, 35) },
                    { offset: 0.65, color: baseColor },
                    { offset: 1, color: adjustColorBrightness(baseColor, -35) },
                ],
            },
            stroke: adjustColorBrightness(baseColor, -30),
            lineWidth: 0.5,
        }, 2));
        children.push(polygon(geo.cap, {
            fill: {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 1,
                colorStops: [
                    { offset: 0, color: adjustColorBrightness(topColor, 25) },
                    { offset: 1, color: adjustColorBrightness(topColor, -5) },
                ],
            },
            stroke: adjustColorBrightness(topColor, -20),
            lineWidth: 0.75,
        }, 4));
        return children;
    }
    const geo = getHorizontalCylinderGeometry(rect, offsets);
    if (shadow3D) {
        children.push(polygon(geo.shadow, { fill: 'rgba(0, 0, 0, 0.12)' }, 0, true));
    }
    children.push(polygon(geo.body, {
        fill: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
                { offset: 0, color: adjustColorBrightness(baseColor, -20) },
                { offset: 0.28, color: adjustColorBrightness(baseColor, 35) },
                { offset: 0.65, color: baseColor },
                { offset: 1, color: adjustColorBrightness(baseColor, -35) },
            ],
        },
        stroke: adjustColorBrightness(baseColor, -30),
        lineWidth: 0.5,
    }, 2));
    children.push(polygon(geo.cap, {
        fill: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 1,
            colorStops: [
                { offset: 0, color: adjustColorBrightness(rightColor, 15) },
                { offset: 1, color: adjustColorBrightness(rightColor, -15) },
            ],
        },
        stroke: adjustColorBrightness(rightColor, -35),
        lineWidth: 0.75,
    }, 4));
    return children;
}
export function buildPrismElements(options) {
    const { rect, isVertical, isDark, shadow3D, offsets, palette } = options;
    const { baseColor, topColor, rightColor } = palette;
    const faces = getPrismFacePoints(rect, offsets);
    const children = [];
    if (shadow3D) {
        children.push(polygon(faces.shadow, {
            fill: isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.12)',
        }, 1, true));
    }
    children.push(polygon(faces.front, {
        fill: isVertical ? {
            type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
                { offset: 0, color: adjustColorBrightness(baseColor, 20) },
                { offset: 0.25, color: baseColor },
                { offset: 1, color: adjustColorBrightness(baseColor, -15) },
            ],
        } : baseColor,
        stroke: adjustColorBrightness(baseColor, -35),
        lineWidth: 0.5,
    }, 2));
    children.push(polygon(faces.side, {
        fill: isVertical ? {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
                { offset: 0, color: rightColor },
                { offset: 1, color: adjustColorBrightness(rightColor, -20) },
            ],
        } : rightColor,
        stroke: adjustColorBrightness(rightColor, -40),
        lineWidth: 0.5,
    }, 1));
    children.push(polygon(faces.top, {
        fill: isVertical ? {
            type: 'linear', x: 0, y: 0, x2: 1, y2: 1,
            colorStops: [
                { offset: 0, color: adjustColorBrightness(topColor, 20) },
                { offset: 1, color: topColor },
            ],
        } : topColor,
        stroke: adjustColorBrightness(topColor, -20),
        lineWidth: 0.5,
    }, 3));
    return children;
}
export function buildValueLabelElement(text, placement, isDark) {
    const { labelX, labelY, textAlign, textVerticalAlign, rotation, isLightText } = placement;
    const textElement = {
        type: 'text',
        style: {
            text,
            x: labelX,
            y: labelY,
            textAlign,
            textVerticalAlign,
            font: 'bold 11px sans-serif',
            fill: isLightText ? '#ffffff' : (isDark ? '#f8fafc' : '#1f2937'),
            stroke: isLightText ? 'rgba(0, 0, 0, 0.75)' : (isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.9)'),
            lineWidth: isLightText ? 2.5 : 1.5,
        },
        z2: 5,
    };
    if (rotation !== 0) {
        textElement.rotation = rotation;
        textElement.originX = labelX;
        textElement.originY = labelY;
    }
    return textElement;
}
/** "//" cut mark drawn across a bar whose value exceeds the axis-break cutoff. */
export function buildAxisBreakMarkElement(rect, isVertical) {
    const { x, y } = getAxisBreakMarkPosition(rect, isVertical);
    return {
        type: 'text',
        style: {
            text: '//',
            x,
            y,
            textAlign: 'center',
            textVerticalAlign: 'middle',
            font: 'bold 14px monospace',
            fill: '#ffffff',
            stroke: 'rgba(0, 0, 0, 0.8)',
            lineWidth: 2,
        },
        z2: 6,
    };
}
//# sourceMappingURL=isometricShapes.js.map