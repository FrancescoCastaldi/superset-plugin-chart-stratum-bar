import { CategoricalColorNamespace, DataRecord, ensureIsArray } from '@superset-ui/core';
import { DEFAULT_COLORS } from '../utils/colors';
import { StratumBarSeries, StratumBarSeriesItem, BenchmarkConfig, StratumBarFormData } from '../types';

export function resolveColors(
  fd: StratumBarFormData,
  rawFd: any,
  scaleInstance: any
) {
  const dashLabelColors: Record<string, string> = {
    ...(rawFd.label_colors || {}),
    ...(fd.label_colors || {}),
  };

  let manualJsonColors: Record<string, string> = {};
  if (fd.custom_colors_json) {
    try {
      if (typeof fd.custom_colors_json === 'string' && fd.custom_colors_json.trim()) {
        manualJsonColors = JSON.parse(fd.custom_colors_json);
      } else if (typeof fd.custom_colors_json === 'object') {
        manualJsonColors = fd.custom_colors_json as Record<string, string>;
      }
    } catch (e) {
      console.warn('[StratumBar] Errore nel parsing di custom_colors_json:', e);
    }
  }

  const combinedLabelColors: Record<string, string> = {
    ...dashLabelColors,
    ...manualJsonColors,
  };

  const lookupColor = (key: string): string | undefined => {
    if (!key) return undefined;
    if (combinedLabelColors[key]) return combinedLabelColors[key];
    const lowerKey = key.toLowerCase();
    const found = Object.keys(combinedLabelColors).find(k => k.toLowerCase() === lowerKey);
    if (found) return combinedLabelColors[found];

    if (key.includes(' · ')) {
      const parts = key.split(' · ');
      for (const p of parts) {
        const trimmed = p.trim();
        if (combinedLabelColors[trimmed]) return combinedLabelColors[trimmed];
        const subFound = Object.keys(combinedLabelColors).find(k => k.toLowerCase() === trimmed.toLowerCase());
        if (subFound) return combinedLabelColors[subFound];
      }
    }
    return undefined;
  };

  let palette = DEFAULT_COLORS;
  if (scaleInstance && typeof scaleInstance.colors === 'object' && Array.isArray(scaleInstance.colors)) {
    palette = scaleInstance.colors;
  }

  const getColor = (key: string, idx: number): string => {
    const explicit = lookupColor(key);
    if (explicit) return explicit;
    if (scaleInstance && typeof scaleInstance.getColor === 'function') {
      const scaleColor = scaleInstance.getColor(key);
      if (scaleColor) return scaleColor;
    }
    return palette[idx % palette.length];
  };

  return { combinedLabelColors, palette, getColor };
}

export function resolveDimensions(
  fd: StratumBarFormData,
  sampleRow: Record<string, any>
) {
  const getColName = (col: any): string => {
    if (!col) return '';
    if (typeof col === 'string') return col;
    if (typeof col === 'object') {
      return col.label || col.sqlExpression || col.column_name || col.name || String(col);
    }
    return String(col);
  };

  const rawXAxisList = ensureIsArray(fd.x_axis).map(getColName).filter(Boolean);
  const rawXGroup = getColName(fd.x_axis_group);
  const rawGroupbyList = ensureIsArray(fd.groupby).map(getColName).filter(Boolean);

  let primaryDimName = '';
  let secondaryDimName: string | undefined = undefined;

  if (rawXGroup) {
    primaryDimName = rawXGroup;
    secondaryDimName =
      rawXAxisList.find(c => c.toLowerCase() !== rawXGroup.toLowerCase()) ||
      rawGroupbyList.find(c => c.toLowerCase() !== rawXGroup.toLowerCase());
  } else if (rawXAxisList.length >= 2) {
    primaryDimName = rawXAxisList[0];
    secondaryDimName = rawXAxisList[1];
  } else if (rawXAxisList.length === 1 && rawGroupbyList.length > 0) {
    primaryDimName = rawXAxisList[0];
    secondaryDimName = rawGroupbyList.find(c => c.toLowerCase() !== primaryDimName.toLowerCase());
  } else if (rawXAxisList.length === 1) {
    primaryDimName = rawXAxisList[0];
  } else if (rawGroupbyList.length > 0) {
    primaryDimName = rawGroupbyList[0];
    secondaryDimName = rawGroupbyList[1];
  } else {
    primaryDimName = 'category';
  }

  const rowKeys = Object.keys(sampleRow);
  const findRowKey = (name?: string) => {
    if (!name) return undefined;
    return rowKeys.find(k => k.toLowerCase() === name.toLowerCase());
  };

  const resolvedXAxis = primaryDimName;
  const actualXKey = findRowKey(primaryDimName) || primaryDimName;
  const actualBreakdownKey = findRowKey(secondaryDimName);

  return { resolvedXAxis, actualXKey, actualBreakdownKey, secondaryDimName };
}

export function computeBenchmark(
  series: StratumBarSeries[],
  showBenchmark: boolean,
  benchmarkType: string,
  benchmarkValue: number,
  formatter: (v: number) => string
): BenchmarkConfig | undefined {
  if (!showBenchmark) return undefined;

  let resolvedBenchmarkVal = Number(benchmarkValue) || 0;
  let bLabel = `Benchmark (${formatter(resolvedBenchmarkVal)})`;

  if (benchmarkType === 'average' || benchmarkType === 'median') {
    const allVals: number[] = [];
    series.forEach(s => {
      s.data.forEach(v => {
        if (typeof v === 'number') allVals.push(v);
      });
    });

    if (allVals.length > 0) {
      if (benchmarkType === 'average') {
        resolvedBenchmarkVal = allVals.reduce((a, b) => a + b, 0) / allVals.length;
        bLabel = `Media (${formatter(resolvedBenchmarkVal)})`;
      } else {
        allVals.sort((a, b) => a - b);
        const mid = Math.floor(allVals.length / 2);
        resolvedBenchmarkVal = allVals.length % 2 !== 0 ? allVals[mid] : (allVals[mid - 1] + allVals[mid]) / 2;
        bLabel = `Mediana (${formatter(resolvedBenchmarkVal)})`;
      }
    }
  }

  return {
    value: resolvedBenchmarkVal,
    label: bLabel,
  };
}
