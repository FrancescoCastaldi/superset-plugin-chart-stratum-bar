const fs = require('fs');
const p2D = 'D:/Sviluppo/superset-plugins/superset-plugin-chart-stratum-bar/src/components/renderers2D.ts';
const p3D = 'D:/Sviluppo/superset-plugins/superset-plugin-chart-stratum-bar/src/components/renderers3D.ts';
let code2D = fs.readFileSync(p2D, 'utf8');
let code3D = fs.readFileSync(p3D, 'utf8');

const importStr = "import { getCategoryAxisConfig, getValueAxisConfig, getSecondaryValueAxisConfig, getLegendConfig, getTooltipConfig, getGridConfig } from '../utils/echartsUtils';\n";

code2D = code2D.replace("import { StratumBarTransformedProps } from '../types';", "import { StratumBarTransformedProps } from '../types';\n" + importStr);
code3D = code3D.replace("import { StratumBarTransformedProps } from '../types';", "import { StratumBarTransformedProps } from '../types';\n" + importStr);

// Category axis
code2D = code2D.replace(/const categoryAxis = \{[\s\S]*?nameTextStyle: \{[^\}]*\},[\s\S]*?\};/m, 
  "const categoryAxis = getCategoryAxisConfig(categories, isVertical, isDark, isVertical ? xAxisTitle : yAxisTitle);");
code3D = code3D.replace(/const categoryAxis = \{[\s\S]*?nameTextStyle: \{[^\}]*\},[\s\S]*?\};/m, 
  "const categoryAxis = getCategoryAxisConfig(categories, isVertical, isDark, isVertical ? xAxisTitle : yAxisTitle);");

// Value axis
code2D = code2D.replace(/const valueAxis = \{[\s\S]*?nameTextStyle: \{[^\}]*\},[\s\S]*?\};/m, 
  "const valueAxis = getValueAxisConfig(isVertical, isDark, isVertical ? yAxisTitle : xAxisTitle);");
code3D = code3D.replace(/const valueAxis = \{[\s\S]*?nameTextStyle: \{[^\}]*\},[\s\S]*?\};/m, 
  "const valueAxis = getValueAxisConfig(isVertical, isDark, isVertical ? yAxisTitle : xAxisTitle);");

// Secondary Value axis
code2D = code2D.replace(/const secondaryValueAxis = \{[\s\S]*?nameTextStyle: \{[^\}]*\},[\s\S]*?\};/m, 
  "const secondaryValueAxis = getSecondaryValueAxisConfig(isVertical, secondaryLineColor, yAxis2Format, yAxis2Title);");
code3D = code3D.replace(/const secondaryValueAxis = \{[\s\S]*?nameTextStyle: \{[^\}]*\},[\s\S]*?\};/m, 
  "const secondaryValueAxis = getSecondaryValueAxisConfig(isVertical, secondaryLineColor, yAxis2Format, yAxis2Title);");

// grid
code2D = code2D.replace(/grid: \{[\s\S]*?containLabel: true,[\s\S]*?\},/m, 
  "grid: getGridConfig(isVertical, hasDualYAxis || false, legendOrientation || 'top'),");
code3D = code3D.replace(/grid: \{[\s\S]*?containLabel: true,[\s\S]*?\},/m, 
  "grid: getGridConfig(isVertical, hasDualYAxis || false, legendOrientation || 'top'),");

// legend 2D
code2D = code2D.replace(/const legendData = series[\s\S]*?data: legendData,[\s\S]*?\};/m,
  "const legend = getLegendConfig(series, colorScheme, showLegend || false, legendOrientation || 'top', isDark);");

// legend 3D (which is inline in the return object)
code3D = code3D.replace(/const legendData = series[\s\S]*?\}\)\);/m, 
  "const legend = getLegendConfig(series, colorScheme, showLegend || false, legendOrientation || 'top', isDark);");
code3D = code3D.replace(/legend: \{[\s\S]*?data: legendData,[\s\S]*?\},/m, "legend,");

// tooltip 2D
code2D = code2D.replace(/const tooltip = \{[\s\S]*?\}\)\);\s*return html;\s*\},[\s\S]*?\};/m, 
  `const tooltip = getTooltipConfig(isDark, (params: any) => {
    if (!Array.isArray(params) || params.length === 0) return '';
    const cat = params[0].axisValueLabel;
    let html = \`<div style="font-weight: 700; margin-bottom: 8px; color: \${isDark ? '#f8fafc' : '#111827'}; font-size: 14px;">\${cat}</div>\`;

    params.forEach((it: any) => {
      if (it.seriesName === '__track_bg__') return;
      const color = it.color && typeof it.color === 'string' ? it.color : (it.color?.colorStops?.[0]?.color || '#3b82f6');
      const val = it.value;
      const isSec = it.seriesName === yAxis2Title || it.seriesIndex === series.length - 1 && hasDualYAxis;
      const formatted = yAxis2Format === '.2%' && isSec && typeof val === 'number'
        ? \`\${(val * 100).toFixed(1)}%\`
        : (typeof val === 'number' ? val.toLocaleString('it-IT') : (val !== null && val !== undefined ? String(val) : 'N/D'));

      html += \`
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 18px; margin: 4px 0; font-size: 12px;">
          <span style="display: flex; align-items: center; gap: 7px;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: \${it.seriesType === 'line' ? '50%' : '2px'}; background: \${color};"></span>
            <span style="font-weight: 500;">\${it.seriesName}</span>
          </span>
          <span style="font-weight: 700; font-variant-numeric: tabular-nums; color: \${isSec ? secondaryLineColor : 'inherit'};\'>\${formatted}</span>
        </div>
      \`;

      if (showBenchmark && benchmark && typeof benchmark.value === 'number' && typeof val === 'number' && it.seriesIndex === 0) {
        const delta = val - benchmark.value;
        const deltaPct = benchmark.value !== 0 ? (delta / benchmark.value) * 100 : 0;
        const isPositive = delta >= 0;
        const badgeColor = isPositive ? '#10b981' : '#ef4444';
        const sign = isPositive ? '+' : '';
        html += \`
          <div style="font-size: 11px; color: \${badgeColor}; text-align: right; margin-top: 2px;">
            vs Target: <strong>\${sign}\${deltaPct.toFixed(1)}%</strong> (\${sign}\${delta.toLocaleString('it-IT')})
          </div>
        \`;
      }
    });
    return html;
  });`
);

// tooltip 3D
code3D = code3D.replace(/const tooltip = \{[\s\S]*?\}\)\);\s*return html;\s*\},[\s\S]*?\};/m, 
  `const tooltip = getTooltipConfig(isDark, (params: any) => {
    const items = Array.isArray(params) ? params : [params];
    if (items.length === 0) return '';
    const catName = categories[items[0].dataIndex] || items[0].name;

    let html = \`<div style="font-weight: 700; margin-bottom: 8px; font-size: 14px; color: \${isDark ? '#f8fafc' : '#111827'};\'>\${catName} <span style="font-size: 10px; color: #38bdf8; margin-left: 4px;">[3D View]</span></div>\`;

    items.forEach(it => {
      const val = it.value?.[1] ?? it.value;
      const isSec = it.seriesName === yAxis2Title || it.seriesType === 'line';
      const formatted = yAxis2Format === '.2%' && isSec && typeof val === 'number'
        ? \`\${(val * 100).toFixed(1)}%\`
        : (typeof val === 'number' ? val.toLocaleString('it-IT') : String(val ?? '-'));
      const color = isSec ? secondaryLineColor : (colorScheme[it.seriesIndex % colorScheme.length] || '#38bdf8');

      html += \`
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 18px; margin: 4px 0; font-size: 12px;">
          <span style="display: flex; align-items: center; gap: 7px;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: \${isSec ? '50%' : '2px'}; background: \${color};"></span>
            <span style="font-weight: 500;">\${it.seriesName}</span>
          </span>
          <span style="font-weight: 700; font-variant-numeric: tabular-nums; color: \${isSec ? secondaryLineColor : 'inherit'};\'>\${formatted}</span>
        </div>
      \`;

      if (showBenchmark && benchmark && typeof benchmark.value === 'number' && typeof val === 'number' && !isSec) {
        const delta = val - benchmark.value;
        const deltaPct = benchmark.value !== 0 ? (delta / benchmark.value) * 100 : 0;
        const isPositive = delta >= 0;
        const badgeColor = isPositive ? '#10b981' : '#ef4444';
        const sign = isPositive ? '+' : '';
        html += \`
          <div style="font-size: 11px; color: \${badgeColor}; text-align: right; margin-top: 2px;">
            vs Target: <strong>\${sign}\${deltaPct.toFixed(1)}%</strong> (\${sign}\${delta.toLocaleString('it-IT')})
          </div>
        \`;
      }
    });

    return html;
  });`
);

// padding removals since they are part of grid
code2D = code2D.replace(/const rightPadding = [^;]*;/m, "");
code3D = code3D.replace(/const rightPadding = [^;]*;/m, "");

fs.writeFileSync(p2D, code2D);
fs.writeFileSync(p3D, code3D);
