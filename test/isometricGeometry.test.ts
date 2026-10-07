import {
  MIN_BAR_LENGTH_3D,
  computeBarRect3D,
  compute3DLabelPlacement,
  getAxisBreakMarkPosition,
  getCapOffsets,
  getCylinderCapRadius,
  getEllipsePoints,
  getGroupedBarSlot,
  getHorizontalCylinderGeometry,
  getHorizontalPedestalPoints,
  getIsometricOffsets,
  getPedestalSize,
  getPrismFacePoints,
  getStackedBarThickness,
  getVerticalCylinderGeometry,
  getVerticalPedestalPoints,
  getZeroFootprintPoints,
  isTinySegment,
} from '../src/utils/isometricGeometry';

// Vertical mock coordinate system: category c -> x = 100 + 100c, value v -> y = 400 - v.
const vCoord = ([c, v]: [number, number]) => [100 + c * 100, 400 - v];
// Horizontal mock coordinate system: value v -> x = 50 + v, category c -> y = 100 + 100c.
const hCoord = ([v, c]: [number, number]) => [50 + v, 100 + c * 100];

const offsets = { offsetX: 18, offsetY: 8 };
const rect = { x0: 10, x1: 30, yTop: 100, yBase: 200 };

describe('isometric projection', () => {
  it('rounds the depth vector to whole pixels from depth and tilt', () => {
    expect(getIsometricOffsets(20, 25)).toEqual({ offsetX: 18, offsetY: 8 });
    expect(getIsometricOffsets(30, 40)).toEqual({ offsetX: 23, offsetY: 19 });
    expect(getIsometricOffsets(10, 0)).toEqual({ offsetX: 10, offsetY: 0 });
  });

  it('samples ellipse points counter-clockwise starting at angle 0', () => {
    const pts = getEllipsePoints(0, 0, 10, 5, 4);
    expect(pts).toHaveLength(4);
    expect(pts[0]).toEqual([10, 0]);
    expect(pts[1][0]).toBeCloseTo(0, 10);
    expect(pts[1][1]).toBeCloseTo(5, 10);
    expect(pts[2][0]).toBeCloseTo(-10, 10);
    expect(getEllipsePoints(1, 2, 3, 4)).toHaveLength(24);
  });
});

describe('bar sizing and group offsets', () => {
  it('clamps stacked bar thickness to [14, 48]', () => {
    expect(getStackedBarThickness(10)).toBe(14);
    expect(getStackedBarThickness(60)).toBeCloseTo(27);
    expect(getStackedBarThickness(500)).toBe(48);
  });

  it('centres a single grouped bar with no gap', () => {
    expect(getGroupedBarSlot(100, 1, 0)).toEqual({ thickness: 40, groupOffset: 0 });
  });

  it('spreads grouped bars symmetrically around the category centre', () => {
    const left = getGroupedBarSlot(100, 2, 0);
    const right = getGroupedBarSlot(100, 2, 1);
    // maxGroup = 75, thickness = 75/2 - 3 = 34.5, gap = 2
    expect(left.thickness).toBe(34.5);
    expect(left.groupOffset).toBe(-18.25);
    expect(right.groupOffset).toBe(18.25);
    expect(getGroupedBarSlot(100, 3, 1).groupOffset).toBe(0);
  });

  it('clamps grouped thickness to [6, 40]', () => {
    expect(getGroupedBarSlot(20, 8, 0).thickness).toBe(6);
    expect(getGroupedBarSlot(1000, 1, 0).thickness).toBe(40);
  });

  it('computes pedestal sizes for stacked and grouped layouts', () => {
    expect(getPedestalSize(10, true)).toBe(28);
    expect(getPedestalSize(200, true)).toBe(70);
    expect(getPedestalSize(10, false)).toBe(40);
    expect(getPedestalSize(100, false)).toBe(85);
    expect(getPedestalSize(400, false)).toBe(160);
  });
});

describe('computeBarRect3D', () => {
  const base = { categoryIndex: 1, baseVal: 0, seriesIdx: 0, numSeries: 1, bandSize: 100 };

  it('vertical grouped: centres the bar on the category and spans 0..val', () => {
    const r = computeBarRect3D({ ...base, isVertical: true, isStacked: false, val: 150, coord: vCoord });
    expect(r).toEqual({ x0: 180, x1: 220, yTop: 250, yBase: 400 });
  });

  it('vertical stacked: starts the segment at the accumulated base', () => {
    const r = computeBarRect3D({ ...base, isVertical: true, isStacked: true, val: 50, baseVal: 100, coord: vCoord });
    // thickness = clamp(100 * 0.45) = 45
    expect(r).toEqual({ x0: 177.5, x1: 222.5, yTop: 250, yBase: 300 });
  });

  it('vertical: enforces the minimum length for tiny positive and negative values', () => {
    const pos = computeBarRect3D({ ...base, isVertical: true, isStacked: false, val: 1, coord: vCoord });
    expect(pos.yBase - pos.yTop).toBe(MIN_BAR_LENGTH_3D);
    const neg = computeBarRect3D({ ...base, isVertical: true, isStacked: false, val: -1, coord: vCoord });
    expect(neg.yTop - neg.yBase).toBe(MIN_BAR_LENGTH_3D);
  });

  it('horizontal grouped: applies the group offset on the y axis', () => {
    const r = computeBarRect3D({ ...base, isVertical: false, isStacked: false, val: 120, seriesIdx: 1, numSeries: 2, coord: hCoord });
    expect(r.x0).toBe(50);
    expect(r.x1).toBe(170);
    expect(r.yTop).toBe(200 + 18.25 - 17.25);
    expect(r.yBase).toBe(200 + 18.25 + 17.25);
  });

  it('horizontal stacked: extends from base to base + val', () => {
    const r = computeBarRect3D({ ...base, isVertical: false, isStacked: true, val: 30, baseVal: 70, coord: hCoord });
    expect(r).toEqual({ x0: 120, x1: 150, yTop: 177.5, yBase: 222.5 });
  });

  it('horizontal: enforces the minimum length for tiny values', () => {
    const pos = computeBarRect3D({ ...base, isVertical: false, isStacked: false, val: 0.5, coord: hCoord });
    expect(pos.x1 - pos.x0).toBe(MIN_BAR_LENGTH_3D);
    const neg = computeBarRect3D({ ...base, isVertical: false, isStacked: false, val: -0.5, coord: hCoord });
    expect(neg.x0 - neg.x1).toBe(MIN_BAR_LENGTH_3D);
  });

  it('leaves zero values untouched', () => {
    const r = computeBarRect3D({ ...base, isVertical: true, isStacked: false, val: 0, coord: vCoord });
    expect(r.yTop).toBe(r.yBase);
  });
});

describe('pedestal, footprint and prism faces', () => {
  it('builds the vertical pedestal top, front and side bevels', () => {
    const p = getVerticalPedestalPoints([100, 400], 80, offsets);
    expect(p.top).toEqual([[60, 400], [140, 400], [158, 392], [78, 392]]);
    expect(p.front).toEqual([[60, 400], [140, 400], [140, 405], [60, 405]]);
    expect(p.side).toEqual([[140, 400], [158, 392], [158, 397], [140, 405]]);
  });

  it('builds the horizontal pedestal plinth and top facet', () => {
    const p = getHorizontalPedestalPoints([50, 200], 60, offsets);
    expect(p.plinth).toEqual([[45, 170], [50, 170], [50, 230], [45, 230]]);
    expect(p.top).toEqual([[45, 170], [50, 170], [68, 162], [63, 162]]);
  });

  it('extrudes the zero-value footprint at half depth', () => {
    expect(getZeroFootprintPoints(rect, true, offsets)).toEqual([[10, 200], [30, 200], [39, 196], [19, 196]]);
    expect(getZeroFootprintPoints(rect, false, offsets)).toEqual([[10, 100], [19, 96], [19, 196], [10, 200]]);
  });

  it('builds the prism shadow, front, side and top (cap) faces', () => {
    const f = getPrismFacePoints(rect, offsets);
    expect(f.front).toEqual([[10, 100], [30, 100], [30, 200], [10, 200]]);
    expect(f.side).toEqual([[30, 100], [48, 92], [48, 192], [30, 200]]);
    expect(f.top).toEqual([[10, 100], [30, 100], [48, 92], [28, 92]]);
    expect(f.shadow[0]).toEqual([11, 201]);
    expect(f.shadow[2][0]).toBeCloseTo(30 + 18 * 0.7);
    expect(f.shadow[2][1]).toBeCloseTo(200 - 8 * 0.35 + 1);
  });
});

describe('cylinder caps', () => {
  it('keeps a minimum cap radius of 5px', () => {
    expect(getCylinderCapRadius(2)).toBe(5);
    expect(getCylinderCapRadius(20)).toBeCloseTo(14);
  });

  it('uses cylinder radii as label clearance only for cylinders', () => {
    expect(getCapOffsets('prism', offsets)).toEqual({ topCapOffset: 8, rightCapOffset: 18 });
    const cyl = getCapOffsets('cylinder', offsets);
    expect(cyl.topCapOffset).toBeCloseTo(5.6);
    expect(cyl.rightCapOffset).toBeCloseTo(12.6);
  });

  it('vertical cylinder: body closes on itself with a 13-point bottom rim and a cap on top', () => {
    const g = getVerticalCylinderGeometry(rect, offsets);
    expect(g.body).toHaveLength(3 + 13 + 1);
    expect(g.body[0]).toEqual(g.body[g.body.length - 1]);
    expect(g.body[3]).toEqual([30, 200]);
    expect(g.cap).toHaveLength(24);
    expect(g.cap[0]).toEqual([30, 100]);
    expect(g.shadow[0][0]).toBeCloseTo(20 + 18 * 0.35 + 10 * 1.05);
  });

  it('horizontal cylinder: rim at the bar end and a flat ground shadow', () => {
    const g = getHorizontalCylinderGeometry(rect, offsets);
    expect(g.body).toHaveLength(2 + 13 + 2);
    expect(g.body[2][0]).toBeCloseTo(30);
    expect(g.body[2][1]).toBeCloseTo(100);
    expect(g.shadow).toEqual([[10, 200], [30, 200], [36, 204], [16, 204]]);
    expect(g.cap[0][0]).toBeCloseTo(30 + 12.6);
    expect(g.cap[0][1]).toBe(150);
  });
});

describe('axis break cut points and label placement', () => {
  it('places the "//" cut mark near the top (vertical) or the end (horizontal)', () => {
    expect(getAxisBreakMarkPosition(rect, true)).toEqual({ x: 20, y: 108 });
    expect(getAxisBreakMarkPosition(rect, false)).toEqual({ x: 22, y: 150 });
  });

  it('flags tiny stacked segments per orientation', () => {
    expect(isTinySegment({ x0: 0, x1: 30, yTop: 100, yBase: 110 }, true)).toBe(true);
    expect(isTinySegment({ x0: 0, x1: 30, yTop: 100, yBase: 120 }, true)).toBe(false);
    expect(isTinySegment({ x0: 0, x1: 15, yTop: 0, yBase: 100 }, false)).toBe(true);
  });

  const placementBase = { rect, offsets, topCapOffset: 8, rightCapOffset: 18 };

  it('top: outermost segment sits above the cap, inner segments are centred', () => {
    expect(compute3DLabelPlacement({ ...placementBase, valuePosition: 'top', isVertical: true, isTopSegment: true })).toEqual({
      labelX: 29, labelY: 84, textAlign: 'center', textVerticalAlign: 'bottom', rotation: 0, isLightText: false,
    });
    expect(compute3DLabelPlacement({ ...placementBase, valuePosition: 'top', isVertical: false, isTopSegment: true })).toEqual({
      labelX: 56, labelY: 146, textAlign: 'left', textVerticalAlign: 'middle', rotation: 0, isLightText: false,
    });
    expect(compute3DLabelPlacement({ ...placementBase, valuePosition: 'top', isVertical: true, isTopSegment: false })).toEqual({
      labelX: 20, labelY: 150, textAlign: 'center', textVerticalAlign: 'middle', rotation: 0, isLightText: true,
    });
  });

  it('inside: always centred with light text', () => {
    const p = compute3DLabelPlacement({ ...placementBase, valuePosition: 'inside', isVertical: false, isTopSegment: true });
    expect(p).toEqual({ labelX: 20, labelY: 150, textAlign: 'center', textVerticalAlign: 'middle', rotation: 0, isLightText: true });
  });

  it('slanted: 45° above vertical bars, -35° beyond horizontal bars, 45° centred for inner segments', () => {
    const v = compute3DLabelPlacement({ ...placementBase, valuePosition: 'slanted', isVertical: true, isTopSegment: true });
    expect(v).toMatchObject({ labelX: 29, labelY: 86, textAlign: 'left', isLightText: false });
    expect(v.rotation).toBeCloseTo(Math.PI / 4);
    const h = compute3DLabelPlacement({ ...placementBase, valuePosition: 'slanted', isVertical: false, isTopSegment: true });
    expect(h).toMatchObject({ labelX: 54, labelY: 146, textAlign: 'left' });
    expect(h.rotation).toBeCloseTo((-35 * Math.PI) / 180);
    const inner = compute3DLabelPlacement({ ...placementBase, valuePosition: 'slanted', isVertical: true, isTopSegment: false });
    expect(inner).toMatchObject({ labelX: 20, labelY: 150, isLightText: true });
    expect(inner.rotation).toBeCloseTo(Math.PI / 4);
  });
});
