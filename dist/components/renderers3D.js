import { getCategoryAxisConfig, getValueAxisConfig, getSecondaryValueAxisConfig, getLegendConfig, getTooltipConfig, getGridConfig, getTooltipFormatter } from '../utils/echartsUtils';
import { calculateAxisBreak, transformValueForAxisBreak } from '../utils/axisBreakUtils';
import { compute3DAxisMax, compute3DStackLayout } from '../utils/barLayout';
import { computeBarRect3D, compute3DLabelPlacement, getCapOffsets, getIsometricOffsets, isTinySegment, } from '../utils/isometricGeometry';
import { SMART_ANNOTATION_STYLE_3D, arrangeAxes, buildLineSeries, getBenchmarkLabel, getBenchmarkLineStyle, getItemOpacity, getSmartAnnotationMarkPoint, isItemSelected, } from '../utils/seriesScaffolding';
import { buildAxisBreakMarkElement, buildCylinderElements, buildPedestalElements, buildPrismElements, buildValueLabelElement, buildZeroFootprintElement, getBarPalette, } from './isometricShapes';
function isAboveCutoff(rawVal, axisBreak) {
    return axisBreak.enabled && typeof rawVal === 'number' && rawVal > axisBreak.effectiveCutoff;
}
/** Label of a 3D bar: always the original (uncompressed) value, prefixed with "//" when capped. */
function format3DValueLabel(rawVal, visualVal, axisBreak) {
    const displayVal = rawVal !== undefined && rawVal !== null ? rawVal : visualVal;
    const formattedVal = typeof displayVal === 'number'
        ? displayVal.toLocaleString('it-IT')
        : String(displayVal);
    return isAboveCutoff(rawVal, axisBreak) ? `// ${formattedVal}` : formattedVal;
}
export function get3DBarOption(props) {
    const { categories, series, benchmark, orientation, barShape3D, depth3D = 20, tilt3D = 25, shadow3D = true, showBenchmark, showValue, valuePosition = 'top', colorScheme, showLegend, legendOrientation, xAxisTitle, yAxisTitle, hasDualYAxis, yAxis2Title, yAxis2Format, secondaryAreaGradient = true, secondaryLineWidth = 3, secondaryLineColor = '#ea580c', themeMode = 'light', enableA11yDecal = false, enableAxisBreak = false, axisBreakMode = 'auto', axisBreakThreshold, } = props;
    const isDark = themeMode === 'dark';
    const isVertical = orientation === 'vertical';
    const offsets = getIsometricOffsets(depth3D, tilt3D);
    const numSeries = series.length || 1;
    const isStacked = props.stacking !== 'none';
    const axisBreak = calculateAxisBreak(series, isStacked, categories.length, {
        enabled: enableAxisBreak,
        mode: axisBreakMode,
        threshold: axisBreakThreshold,
    });
    const layout = compute3DStackLayout(series, categories.length, isStacked, axisBreak);
    const { stackBottoms, topSeriesIdxPerCat } = layout;
    const axisMax = compute3DAxisMax({ layout, axisBreak, isStacked, showBenchmark, benchmark, valuePosition });
    const valueAxis = getValueAxisConfig(isVertical, isDark, isVertical ? yAxisTitle : xAxisTitle, axisMax);
    const categoryAxis = getCategoryAxisConfig(categories, isVertical, isDark, isVertical ? xAxisTitle : yAxisTitle);
    const secondaryValueAxis = getSecondaryValueAxisConfig(isVertical, secondaryLineColor, yAxis2Format, yAxis2Title);
    const { topCapOffset, rightCapOffset } = getCapOffsets(barShape3D, offsets);
    const echartsSeries = [];
    series.forEach((s, seriesIdx) => {
        const baseColor = colorScheme[seriesIdx % colorScheme.length] || '#0284c7';
        const palette = getBarPalette(baseColor);
        const customSeries = {
            name: s.name,
            type: 'custom',
            renderItem: (params, api) => {
                const categoryIndex = isVertical ? api.value(0) : api.value(1);
                const val = isVertical ? api.value(1) : api.value(0);
                if (val === null || val === undefined || isNaN(val))
                    return null;
                const catName = categories[categoryIndex] || '';
                const itemOpacity = getItemOpacity(isItemSelected(props.selectedValues, catName, s.name));
                const bandSize = isVertical ? Math.abs(api.size([1, 0])[0]) : Math.abs(api.size([0, 1])[1]);
                const rect = computeBarRect3D({
                    isVertical,
                    isStacked,
                    categoryIndex,
                    val,
                    baseVal: isStacked ? (stackBottoms[seriesIdx]?.[categoryIndex] || 0) : 0,
                    seriesIdx,
                    numSeries,
                    bandSize,
                    coord: (point) => api.coord(point),
                });
                const children = [];
                if (seriesIdx === 0) {
                    children.push(...buildPedestalElements({
                        isVertical,
                        isStacked,
                        isDark,
                        startPt: api.coord(isVertical ? [categoryIndex, 0] : [0, categoryIndex]),
                        bandSize,
                        offsets,
                    }));
                }
                // Zero values get a footprint slot instead of a deformed 0-height bar; selection dimming is not applied to them.
                if (val === 0) {
                    if (!isStacked) {
                        children.push(buildZeroFootprintElement(rect, isVertical, isDark, offsets));
                    }
                    return {
                        type: 'group',
                        children,
                    };
                }
                const shapeOptions = { rect, isVertical, isDark, shadow3D, offsets, palette };
                children.push(...(barShape3D === 'cylinder'
                    ? buildCylinderElements(shapeOptions)
                    : buildPrismElements(shapeOptions)));
                if (showValue && (!isStacked || !isTinySegment(rect, isVertical))) {
                    const placement = compute3DLabelPlacement({
                        valuePosition,
                        isVertical,
                        isTopSegment: !isStacked || (seriesIdx === topSeriesIdxPerCat[categoryIndex]),
                        rect,
                        offsets,
                        topCapOffset,
                        rightCapOffset,
                    });
                    children.push(buildValueLabelElement(format3DValueLabel(s.data[categoryIndex], val, axisBreak), placement, isDark));
                }
                if (isAboveCutoff(s.data[categoryIndex], axisBreak)) {
                    children.push(buildAxisBreakMarkElement(rect, isVertical));
                }
                children.forEach((c) => {
                    if (c.style)
                        c.style.opacity = itemOpacity;
                });
                return {
                    type: 'group',
                    children,
                };
            },
            data: s.data.map((v, i) => {
                const { visualVal, isCapped, originalVal } = axisBreak.enabled && s.yAxisIndex !== 1
                    ? transformValueForAxisBreak(v, axisBreak)
                    : { visualVal: v, isCapped: false, originalVal: v };
                return {
                    name: categories[i],
                    value: isVertical ? [i, visualVal] : [visualVal, i],
                    originalVal,
                    isCapped,
                };
            }),
            encode: {
                x: 0,
                y: 1,
            },
            z: 2 + seriesIdx,
        };
        if (seriesIdx === 0 && showBenchmark && benchmark && typeof benchmark.value === 'number') {
            customSeries.markLine = {
                symbol: ['none', 'none'],
                silent: false,
                lineStyle: getBenchmarkLineStyle(),
                label: getBenchmarkLabel(benchmark, isVertical ? 'end' : 'start'),
                data: [
                    isVertical ? { yAxis: benchmark.value } : { xAxis: benchmark.value },
                ],
            };
        }
        if (props.showSmartAnnotations) {
            customSeries.markPoint = getSmartAnnotationMarkPoint(baseColor, isDark, SMART_ANNOTATION_STYLE_3D);
        }
        if (s.seriesType === 'line') {
            echartsSeries.push(buildLineSeries({
                name: s.name,
                data: !isVertical ? s.data.map((v, i) => [v, i]) : s.data,
                baseColor,
                isVertical,
                yAxisIndex: s.yAxisIndex,
                isDark,
                showValue,
                yAxis2Format,
                lineWidth: secondaryLineWidth,
                areaGradient: secondaryAreaGradient,
                shadowAlpha: 0.4,
                areaAlpha: 0.22,
                z: 25 + seriesIdx,
            }));
            return;
        }
        echartsSeries.push(customSeries);
    });
    const tooltipFormatter = getTooltipFormatter(categories, isDark, colorScheme, showBenchmark, benchmark, yAxis2Title, yAxis2Format, hasDualYAxis ? secondaryLineColor : undefined, true, isVertical);
    const tooltip = getTooltipConfig(isDark, tooltipFormatter);
    // Legend with explicit per-series colors so swatches match bars
    const legend = getLegendConfig(series, colorScheme, showLegend || false, legendOrientation || 'top', isDark);
    const { xAxis, yAxis } = arrangeAxes(isVertical, hasDualYAxis, categoryAxis, valueAxis, secondaryValueAxis);
    return {
        backgroundColor: 'transparent',
        animationDuration: 750,
        animationEasing: 'cubicOut',
        aria: { enabled: true, decal: { show: enableA11yDecal } },
        grid: getGridConfig(isVertical, hasDualYAxis || false, legendOrientation || 'top'),
        tooltip,
        legend,
        xAxis,
        yAxis,
        series: echartsSeries,
    };
}
//# sourceMappingURL=renderers3D.js.map