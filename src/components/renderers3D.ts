import { StratumBarTransformedProps } from '../types';
import { getCategoryAxisConfig, getValueAxisConfig, getSecondaryValueAxisConfig, getLegendConfig, getTooltipConfig, getGridConfig, getTooltipFormatter } from '../utils/echartsUtils';

import { adjustColorBrightness, hexToRgba } from '../utils/colors';

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

  // If stacked, precompute accumulated bottoms for each series and max total
  const stackBottoms: number[][] = series.map(() => categories.map(() => 0));
  let maxStackedSum = 0;
  if (isStacked) {
    for (let c = 0; c < categories.length; c++) {
      let accum = 0;
      for (let s = 0; s < series.length; s++) {
        stackBottoms[s][c] = accum;
        const v = series[s].data[c];
        if (typeof v === 'number' && !isNaN(v)) {
          accum += v;
        }
      }
      if (accum > maxStackedSum) maxStackedSum = accum;
    }
  }

  // Value Axis (Primary) - when stacked with custom series, ECharts doesn't know the stacked sum automatically
  const axisMax = isStacked && maxStackedSum > 0 ? Math.ceil(maxStackedSum * 1.15) : undefined;
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
        const categoryIndex = api.value(0);
        const val = api.value(1);
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
          const bandWidth = api.size([1, 0])[0];
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
        } else {
          // Horizontal 3D Bar
          const bandHeight = api.size([0, 1])[1];
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
        }

          const children: any[] = [];

          // 1. Base Shadow on ground
          if (shadow3D) {
            children.push({
              type: 'polygon',
              shape: {
                points: [
                  [x0, yBase],
                  [x1, yBase],
                  [x1 + offsetX * 0.7, yBase - offsetY * 0.4],
                  [x0 + offsetX * 0.7, yBase - offsetY * 0.4],
                ],
              },
              style: {
                fill: 'rgba(0, 0, 0, 0.12)',
              },
              silent: true,
              z2: 0,
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

          // 5. Value Label
          if (showValue) {
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
        value: [i, v],
      })),
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
        data: s.data,
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
  const tooltipFormatter = getTooltipFormatter(categories, isDark, colorScheme, showBenchmark, benchmark, yAxis2Title, yAxis2Format, hasDualYAxis ? secondaryLineColor : undefined, true);
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
