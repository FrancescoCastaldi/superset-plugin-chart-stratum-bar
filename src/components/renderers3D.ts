import { StratumBarTransformedProps } from '../types';
import { getCategoryAxisConfig, getValueAxisConfig, getSecondaryValueAxisConfig, getLegendConfig, getTooltipConfig, getGridConfig, getTooltipFormatter } from '../utils/echartsUtils';

import { adjustColorBrightness, hexToRgba } from '../utils/colors';

function getEllipsePoints(cx: number, cy: number, rx: number, ry: number, count = 24): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 2 * Math.PI;
    pts.push([cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)]);
  }
  return pts;
}

export function get3DBarOption(props: StratumBarTransformedProps) {
  const {
    categories,
    series,
    benchmark,
    orientation,
    barShape3D,
    depth3D = 20,
    tilt3D = 25,
    shadow3D = true,
    showBenchmark,
    showValue,
    colorScheme,
    showLegend,
    legendOrientation,
    xAxisTitle,
    yAxisTitle,
    hasDualYAxis,
    yAxis2Title,
    yAxis2Format,
    secondaryAreaGradient = true,
    secondaryLineWidth = 3,
    secondaryLineColor = '#ea580c',
    themeMode = 'light',
    enableA11yDecal = false,
  } = props;

  const isDark = themeMode === 'dark';
  const isVertical = orientation === 'vertical';
  const tiltRad = (tilt3D * Math.PI) / 180;
  const offsetX = Math.round(depth3D * Math.cos(tiltRad));
  const offsetY = Math.round(depth3D * Math.sin(tiltRad));

  const numSeries = series.length || 1;
  const isStacked = props.stacking !== 'none';

  // Precompute accumulated bottoms for stacked mode and max values for scaling
  const stackBottoms: number[][] = series.map(() => categories.map(() => 0));
  let maxStackedSum = 0;
  let maxSingleVal = 0;

  for (let c = 0; c < categories.length; c++) {
    let accum = 0;
    for (let s = 0; s < series.length; s++) {
      const v = series[s].data[c];
      if (typeof v === 'number' && !isNaN(v)) {
        if (v > maxSingleVal) maxSingleVal = v;
        if (isStacked) {
          stackBottoms[s][c] = accum;
          accum += v;
        }
      }
    }
    if (accum > maxStackedSum) maxStackedSum = accum;
  }

  // Value Axis (Primary) - custom series in ECharts needs explicit axisMax for headroom and proper scaling
  let ceilingVal = isStacked ? maxStackedSum : maxSingleVal;
  if (showBenchmark && benchmark && typeof benchmark.value === 'number' && benchmark.value > ceilingVal) {
    ceilingVal = benchmark.value;
  }
  const axisMax = ceilingVal > 0 ? Math.ceil(ceilingVal * 1.15) : undefined;
  const valueAxis = getValueAxisConfig(isVertical, isDark, isVertical ? yAxisTitle : xAxisTitle, axisMax);

  // Category Axis
  const categoryAxis = getCategoryAxisConfig(categories, isVertical, isDark, isVertical ? xAxisTitle : yAxisTitle);

  // Secondary Value Axis (Right Y-Axis - Color-coded)
  const secondaryValueAxis = getSecondaryValueAxisConfig(isVertical, secondaryLineColor, yAxis2Format, yAxis2Title);

  const echartsSeries: any[] = [];

  // Render 3D Isometric Bar using ECharts Custom Series (renderItem)
  series.forEach((s, seriesIdx) => {
    const baseColor = colorScheme[seriesIdx % colorScheme.length] || '#0284c7';
    const topColor = adjustColorBrightness(baseColor, 35);
    const rightColor = adjustColorBrightness(baseColor, -25);

    const customSeries: any = {
      name: s.name,
      type: 'custom',
      renderItem: (params: any, api: any) => {
        const categoryIndex = isVertical ? api.value(0) : api.value(1);
        const val = isVertical ? api.value(1) : api.value(0);
        if (val === null || val === undefined || isNaN(val)) return null;

        let yBase: number;
        let yTop: number;
        let x0: number;
        let x1: number;

        const catName = categories[categoryIndex] || '';
        const hasSelection = Boolean(props.selectedValues && props.selectedValues.length > 0);
        const isSelected = !hasSelection ||
          props.selectedValues!.includes(catName) ||
          props.selectedValues!.includes(s.name) ||
          props.selectedValues!.includes(`${catName} · ${s.name}`);
        const itemOpacity = isSelected ? 1.0 : 0.28;

        if (isVertical) {
          // Vertical 3D Column / Prism
          const bandWidth = Math.abs(api.size([1, 0])[0]);
          if (isStacked) {
            const barWidth = Math.min(Math.max(bandWidth * 0.45, 14), 48);
            const startPoint = api.coord([categoryIndex, 0]);
            const baseVal = stackBottoms[seriesIdx]?.[categoryIndex] || 0;
            const topVal = baseVal + val;
            const ptBase = api.coord([categoryIndex, baseVal]);
            const ptTop = api.coord([categoryIndex, topVal]);

            x0 = startPoint[0] - barWidth / 2;
            x1 = startPoint[0] + barWidth / 2;
            yBase = ptBase[1];
            yTop = ptTop[1];
          } else {
            // Grouped side-by-side with dynamic offset
            const maxGroupWidth = Math.min(bandWidth * 0.75, 140);
            const barWidth = Math.min(Math.max(maxGroupWidth / numSeries - 3, 6), 40);
            const gap = numSeries > 1 ? 2 : 0;
            const groupOffset = (seriesIdx - (numSeries - 1) / 2) * (barWidth + gap);
            const pt = api.coord([categoryIndex, val]);
            const ptBase = api.coord([categoryIndex, 0]);

            x0 = pt[0] + groupOffset - barWidth / 2;
            x1 = pt[0] + groupOffset + barWidth / 2;
            yTop = pt[1];
            yBase = ptBase[1];
          }

          // Enforce minimum visual height for non-zero values so miniature bars are never flat wafers
          const minBarHeight = 6;
          if (val > 0 && yBase - yTop < minBarHeight) {
            yTop = yBase - minBarHeight;
          } else if (val < 0 && yTop - yBase < minBarHeight) {
            yTop = yBase + minBarHeight;
          }
        } else {
          // Horizontal 3D Bar
          const bandHeight = Math.abs(api.size([0, 1])[1]);
          if (isStacked) {
            const barHeight = Math.min(Math.max(bandHeight * 0.45, 14), 48);
            const startPoint = api.coord([0, categoryIndex]);
            const baseVal = stackBottoms[seriesIdx]?.[categoryIndex] || 0;
            const topVal = baseVal + val;
            const ptBase = api.coord([baseVal, categoryIndex]);
            const ptEnd = api.coord([topVal, categoryIndex]);

            yTop = startPoint[1] - barHeight / 2;
            yBase = startPoint[1] + barHeight / 2;
            x0 = ptBase[0];
            x1 = ptEnd[0];
          } else {
            const maxGroupHeight = Math.min(bandHeight * 0.75, 140);
            const barHeight = Math.min(Math.max(maxGroupHeight / numSeries - 3, 6), 40);
            const gap = numSeries > 1 ? 2 : 0;
            const groupOffset = (seriesIdx - (numSeries - 1) / 2) * (barHeight + gap);
            const pt = api.coord([val, categoryIndex]);
            const ptBase = api.coord([0, categoryIndex]);

            yTop = pt[1] + groupOffset - barHeight / 2;
            yBase = pt[1] + groupOffset + barHeight / 2;
            x0 = ptBase[0];
            x1 = pt[0];
          }

          // Enforce minimum visual width for non-zero values
          const minBarWidth = 6;
          if (val > 0 && x1 - x0 < minBarWidth) {
            x1 = x0 + minBarWidth;
          } else if (val < 0 && x0 - x1 < minBarWidth) {
            x1 = x0 - minBarWidth;
          }
        }

        const children: any[] = [];

        // 0. Render Architectural 3D Base Pedestal under this category (rendered once by the first series)
        if (seriesIdx === 0) {
          if (isVertical) {
            const startPt = api.coord([categoryIndex, 0]);
            const baseBandW = Math.abs(api.size([1, 0])[0]);
            const pedW = isStacked
              ? Math.min(Math.max(baseBandW * 0.55, 28), 70)
              : Math.min(Math.max(baseBandW * 0.85, 40), 160);
            const pedX0 = startPt[0] - pedW / 2;
            const pedX1 = startPt[0] + pedW / 2;
            const pedYBase = startPt[1];
            const plinthH = 5;

            // Pedestal Top Face (Piano d'appoggio 3D)
            children.push({
              type: 'polygon',
              shape: {
                points: [
                  [pedX0, pedYBase],
                  [pedX1, pedYBase],
                  [pedX1 + offsetX, pedYBase - offsetY],
                  [pedX0 + offsetX, pedYBase - offsetY],
                ],
              },
              style: {
                fill: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.95)',
                stroke: isDark ? '#334155' : '#cbd5e1',
                lineWidth: 1,
              },
              silent: true,
              z2: 0,
            });

            // Pedestal Front Bevel (Bordo frontale ribassato)
            children.push({
              type: 'polygon',
              shape: {
                points: [
                  [pedX0, pedYBase],
                  [pedX1, pedYBase],
                  [pedX1, pedYBase + plinthH],
                  [pedX0, pedYBase + plinthH],
                ],
              },
              style: {
                fill: isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(226, 232, 240, 0.98)',
                stroke: isDark ? '#1e293b' : '#94a3b8',
                lineWidth: 1,
              },
              silent: true,
              z2: 0,
            });

            // Pedestal Right Bevel (Profondità laterale)
            children.push({
              type: 'polygon',
              shape: {
                points: [
                  [pedX1, pedYBase],
                  [pedX1 + offsetX, pedYBase - offsetY],
                  [pedX1 + offsetX, pedYBase - offsetY + plinthH],
                  [pedX1, pedYBase + plinthH],
                ],
              },
              style: {
                fill: isDark ? 'rgba(15, 23, 42, 0.98)' : 'rgba(203, 213, 225, 0.98)',
                stroke: isDark ? '#1e293b' : '#94a3b8',
                lineWidth: 1,
              },
              silent: true,
              z2: 0,
            });
          } else {
            const startPt = api.coord([0, categoryIndex]);
            const baseBandH = Math.abs(api.size([0, 1])[1]);
            const pedH = isStacked
              ? Math.min(Math.max(baseBandH * 0.55, 28), 70)
              : Math.min(Math.max(baseBandH * 0.85, 40), 160);
            const pedY0 = startPt[1] - pedH / 2;
            const pedY1 = startPt[1] + pedH / 2;
            const pedXBase = startPt[0];
            const plinthW = 5;

            // Backing plinth
            children.push({
              type: 'polygon',
              shape: {
                points: [
                  [pedXBase - plinthW, pedY0],
                  [pedXBase, pedY0],
                  [pedXBase, pedY1],
                  [pedXBase - plinthW, pedY1],
                ],
              },
              style: {
                fill: isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(226, 232, 240, 0.98)',
                stroke: isDark ? '#1e293b' : '#cbd5e1',
                lineWidth: 1,
              },
              silent: true,
              z2: 0,
            });

            // Top facet
            children.push({
              type: 'polygon',
              shape: {
                points: [
                  [pedXBase - plinthW, pedY0],
                  [pedXBase, pedY0],
                  [pedXBase + offsetX, pedY0 - offsetY],
                  [pedXBase - plinthW + offsetX, pedY0 - offsetY],
                ],
              },
              style: {
                fill: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.95)',
                stroke: isDark ? '#334155' : '#cbd5e1',
                lineWidth: 1,
              },
              silent: true,
              z2: 0,
            });
          }
        }

        // Zero-value handling: render subtle footprint slot and skip drawing deformed 0-height bars
        if (val === 0) {
          if (!isStacked) {
            children.push({
              type: 'polygon',
              shape: {
                points: isVertical ? [
                  [x0, yBase],
                  [x1, yBase],
                  [x1 + offsetX * 0.5, yBase - offsetY * 0.5],
                  [x0 + offsetX * 0.5, yBase - offsetY * 0.5],
                ] : [
                  [x0, yTop],
                  [x0 + offsetX * 0.5, yTop - offsetY * 0.5],
                  [x0 + offsetX * 0.5, yBase - offsetY * 0.5],
                  [x0, yBase],
                ],
              },
              style: {
                fill: isDark ? 'rgba(51, 65, 85, 0.25)' : 'rgba(203, 213, 225, 0.4)',
                stroke: isDark ? 'rgba(100, 116, 139, 0.4)' : 'rgba(148, 163, 184, 0.5)',
                lineWidth: 0.75,
                lineDash: [2, 2],
              },
              silent: true,
              z2: 1,
            });
          }
          return {
            type: 'group',
            children,
          };
        }

        const isCylinder = barShape3D === 'cylinder';

          if (isCylinder) {
            if (isVertical) {
              const barWidth = Math.abs(x1 - x0);
              const cx = (x0 + x1) / 2;
              const rx = barWidth / 2;
              const ry = Math.max(offsetY * 0.7, 5);

              // 1. Base Shadow on ground
              if (shadow3D) {
                children.push({
                  type: 'polygon',
                  shape: {
                    points: getEllipsePoints(cx + offsetX * 0.35, yBase, rx * 1.05, ry * 0.8),
                  },
                  style: { fill: 'rgba(0, 0, 0, 0.14)' },
                  silent: true,
                  z2: 0,
                });
              }

              // 2. Cylindrical Curved Body with bottom rim curve
              const bodyPoints: [number, number][] = [
                [x0, yTop],
                [x1, yTop],
                [x1, yBase],
              ];
              for (let step = 0; step <= 12; step++) {
                const a = (step / 12) * Math.PI;
                bodyPoints.push([cx + rx * Math.cos(a), yBase + ry * Math.sin(a)]);
              }
              bodyPoints.push([x0, yTop]);

              children.push({
                type: 'polygon',
                shape: { points: bodyPoints },
                style: {
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
                },
                z2: 2,
              });

              // 3. Top Elliptical Cap
              children.push({
                type: 'polygon',
                shape: {
                  points: getEllipsePoints(cx, yTop, rx, ry),
                },
                style: {
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
                },
                z2: 4,
              });
            } else {
              // Horizontal Cylinder
              const barHeight = Math.abs(yBase - yTop);
              const cy = (yTop + yBase) / 2;
              const ry = barHeight / 2;
              const rx = Math.max(offsetX * 0.7, 5);

              // 1. Base Shadow
              if (shadow3D) {
                children.push({
                  type: 'polygon',
                  shape: {
                    points: [
                      [x0, yBase],
                      [x1, yBase],
                      [x1 + 6, yBase + 4],
                      [x0 + 6, yBase + 4],
                    ],
                  },
                  style: { fill: 'rgba(0, 0, 0, 0.12)' },
                  silent: true,
                  z2: 0,
                });
              }

              // 2. Cylindrical Horizontal Body with right rim curve
              const bodyPoints: [number, number][] = [
                [x0, yTop],
                [x1, yTop],
              ];
              for (let step = 0; step <= 12; step++) {
                const a = -Math.PI / 2 + (step / 12) * Math.PI;
                bodyPoints.push([x1 + rx * Math.cos(a), cy + ry * Math.sin(a)]);
              }
              bodyPoints.push([x0, yBase]);
              bodyPoints.push([x0, yTop]);

              children.push({
                type: 'polygon',
                shape: { points: bodyPoints },
                style: {
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
                },
                z2: 2,
              });

              // 3. Right Elliptical Cap
              children.push({
                type: 'polygon',
                shape: {
                  points: getEllipsePoints(x1, cy, rx, ry),
                },
                style: {
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
                },
                z2: 4,
              });
            }
          } else {
            // Rectangular Prism
            // 1. Base Shadow on ground (cast onto pedestal surface)
            if (shadow3D) {
              children.push({
                type: 'polygon',
                shape: {
                  points: [
                    [x0 + 1, yBase + 1],
                    [x1 + 1, yBase + 1],
                    [x1 + offsetX * 0.7, yBase - offsetY * 0.35 + 1],
                    [x0 + offsetX * 0.7, yBase - offsetY * 0.35 + 1],
                  ],
                },
                style: {
                  fill: isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.12)',
                },
                silent: true,
                z2: 1,
              });
            }

            // 2. Front Face
            children.push({
              type: 'polygon',
              shape: {
                points: [
                  [x0, yTop],
                  [x1, yTop],
                  [x1, yBase],
                  [x0, yBase],
                ],
              },
              style: {
                fill: isVertical ? {
                  type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
                  colorStops: [
                    { offset: 0, color: baseColor },
                    { offset: 1, color: adjustColorBrightness(baseColor, -10) },
                  ],
                } : baseColor,
                stroke: adjustColorBrightness(baseColor, -35),
                lineWidth: 0.5,
              },
              z2: 2,
            });

            // 3. Right / Side Face (Depth extrusion)
            children.push({
              type: 'polygon',
              shape: {
                points: [
                  [x1, yTop],
                  [x1 + offsetX, yTop - offsetY],
                  [x1 + offsetX, yBase - offsetY],
                  [x1, yBase],
                ],
              },
              style: {
                fill: isVertical ? {
                  type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [
                    { offset: 0, color: rightColor },
                    { offset: 1, color: adjustColorBrightness(rightColor, -20) },
                  ],
                } : rightColor,
                stroke: adjustColorBrightness(rightColor, -40),
                lineWidth: 0.5,
              },
              z2: 1,
            });

            // 4. Top Face (Cap)
            children.push({
              type: 'polygon',
              shape: {
                points: [
                  [x0, yTop],
                  [x1, yTop],
                  [x1 + offsetX, yTop - offsetY],
                  [x0 + offsetX, yTop - offsetY],
                ],
              },
              style: {
                fill: isVertical ? {
                  type: 'linear', x: 0, y: 0, x2: 1, y2: 1,
                  colorStops: [
                    { offset: 0, color: adjustColorBrightness(topColor, 20) },
                    { offset: 1, color: topColor },
                  ],
                } : topColor,
                stroke: adjustColorBrightness(topColor, -20),
                lineWidth: 0.5,
              },
              z2: 3,
            });
          }

          // 5. Value Label (rendered only for non-zero values)
          if (showValue && val !== 0) {
            const segmentHeight = Math.abs(yBase - yTop);
            const segmentWidth = Math.abs(x1 - x0);
            const isTiny = isVertical ? segmentHeight < 14 : segmentWidth < 20;

            // In stacked mode, only render if segment has enough space, and place inside the face
            if (!isStacked || !isTiny) {
              const labelX = isStacked
                ? (isVertical ? (x0 + x1) / 2 : (x0 + x1) / 2)
                : (isVertical ? (x0 + x1 + offsetX) / 2 : x1 + offsetX + 8);
              const labelY = isStacked
                ? (isVertical ? (yTop + yBase) / 2 : (yTop + yBase) / 2)
                : (isVertical ? yTop - offsetY - 8 : (yTop + yBase - offsetY) / 2);

              children.push({
                type: 'text',
                style: {
                  text: typeof val === 'number' ? val.toLocaleString('it-IT') : String(val),
                  x: labelX,
                  y: labelY,
                  textAlign: isStacked ? 'center' : (isVertical ? 'center' : 'left'),
                  textVerticalAlign: isStacked ? 'middle' : (isVertical ? 'bottom' : 'middle'),
                  font: 'bold 11px sans-serif',
                  fill: isStacked ? '#ffffff' : (isDark ? '#f8fafc' : '#1f2937'),
                  stroke: isStacked ? 'rgba(0, 0, 0, 0.45)' : undefined,
                  lineWidth: isStacked ? 2 : undefined,
                },
                z2: 5,
              });
            }
          }

          children.forEach((c: any) => {
            if (c.style) c.style.opacity = itemOpacity;
          });

          return {
            type: 'group',
            children,
          };
      },
      data: s.data.map((v, i) => ({
        name: categories[i],
        value: isVertical ? [i, v] : [v, i],
      })),
      encode: {
        x: 0,
        y: 1,
      },
      z: 2 + seriesIdx,
    };

    // Benchmark line
    if (seriesIdx === 0 && showBenchmark && benchmark && typeof benchmark.value === 'number') {
      customSeries.markLine = {
        symbol: ['none', 'none'],
        silent: false,
        lineStyle: {
          color: '#ef4444',
          type: 'dashed',
          width: 2,
        },
        label: {
          position: isVertical ? 'end' : 'start',
          formatter: `${benchmark.label}: ${benchmark.value.toLocaleString('it-IT')}`,
          color: '#dc2626',
          fontSize: 11,
          fontWeight: 700,
          backgroundColor: 'rgba(254, 242, 242, 0.92)',
          borderColor: '#fca5a5',
          borderWidth: 1,
          borderRadius: 4,
          padding: [3, 6],
        },
        data: [
          isVertical ? { yAxis: benchmark.value } : { xAxis: benchmark.value },
        ],
      };
    }

    // Handle Secondary / Line Series overlaid on 3D view
    if (s.seriesType === 'line') {
      const lineSeriesItem: any = {
        name: s.name,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        yAxisIndex: isVertical ? (s.yAxisIndex ?? 0) : 0,
        xAxisIndex: !isVertical ? (s.yAxisIndex ?? 0) : 0,
        data: !isVertical ? s.data.map((v, i) => [v, i]) : s.data,
        lineStyle: {
          width: secondaryLineWidth,
          color: baseColor,
          shadowColor: hexToRgba(baseColor, 0.4),
          shadowBlur: 8,
          shadowOffsetY: 3,
        },
        itemStyle: {
          color: baseColor,
          borderColor: isDark ? '#111827' : '#ffffff',
          borderWidth: 2.5,
        },
        emphasis: {
          scale: true,
          itemStyle: {
            borderWidth: 3,
            shadowBlur: 10,
            shadowColor: hexToRgba(baseColor, 0.6),
          },
        },
        label: {
          show: showValue,
          position: 'top',
          color: baseColor,
          fontWeight: 700,
          fontSize: 11,
          formatter: (params: any) => {
            const val = params.value;
            if (val === null || val === undefined) return '';
            if (yAxis2Format === '.2%') {
              return `${(Number(val) * 100).toFixed(1)}%`;
            }
            return typeof val === 'number' ? val.toLocaleString('it-IT') : String(val);
          },
        },
        z: 25 + seriesIdx,
      };

      if (secondaryAreaGradient) {
        lineSeriesItem.areaStyle = {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: hexToRgba(baseColor, 0.22) },
              { offset: 1, color: hexToRgba(baseColor, 0.0) },
            ],
          },
        };
      }

      echartsSeries.push(lineSeriesItem);
      return;
    }

    echartsSeries.push(customSeries);
  });

  // Tooltip
  const tooltipFormatter = getTooltipFormatter(categories, isDark, colorScheme, showBenchmark, benchmark, yAxis2Title, yAxis2Format, hasDualYAxis ? secondaryLineColor : undefined, true, isVertical);
  const tooltip = getTooltipConfig(isDark, tooltipFormatter);

  

  // Legend with explicit per-series colors so swatches match bars
  const legend = getLegendConfig(series, colorScheme, showLegend || false, legendOrientation || 'top', isDark);

  return {
    backgroundColor: 'transparent',
    animationDuration: 750,
    animationEasing: 'cubicOut' as const,
    aria: { enabled: true, decal: { show: enableA11yDecal } },
    grid: getGridConfig(isVertical, hasDualYAxis || false, legendOrientation || 'top'),
    tooltip,
    legend,
    xAxis: isVertical ? categoryAxis : hasDualYAxis ? [valueAxis, secondaryValueAxis] : valueAxis,
    yAxis: isVertical ? (hasDualYAxis ? [valueAxis, secondaryValueAxis] : valueAxis) : categoryAxis,
    series: echartsSeries,
  };
}
