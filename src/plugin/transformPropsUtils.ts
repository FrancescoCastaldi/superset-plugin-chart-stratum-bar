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
  const rowKeys = Object.keys(sampleRow || {});

  // Extract all candidate string identifiers for a given column config
  const getColCandidates = (col: any): string[] => {
    if (!col) return [];
    if (typeof col === 'string') return [col];
    if (typeof col === 'object' && col !== null) {
      return [
        col.column_name,
        col.sqlExpression,
        col.label,
        col.name,
        col.verbose_name,
        String(col),
      ].filter(Boolean);
    }
    return [String(col)];
  };

  const getPrimaryColName = (col: any): string => {
    if (!col) return '';
    if (typeof col === 'string') return col;
    if (typeof col === 'object' && col !== null) {
      return col.label || col.verbose_name || col.column_name || col.sqlExpression || col.name || String(col);
    }
    return String(col);
  };

  const rawXAxisItems = ensureIsArray(fd.x_axis).filter(Boolean);
  const rawXGroupItem = fd.x_axis_group;
  const rawGroupbyItems = ensureIsArray(fd.groupby).filter(Boolean);

  const rawXAxisList = rawXAxisItems.map(getPrimaryColName).filter(Boolean);
  const rawXGroup = getPrimaryColName(rawXGroupItem);
  const rawGroupbyList = rawGroupbyItems.map(getPrimaryColName).filter(Boolean);

  // Helper to compare two dimension names normalized (ignoring spaces, dashes, underscores)
  const isSameDim = (a?: string, b?: string): boolean => {
    if (!a || !b) return false;
    const normA = a.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normB = b.toLowerCase().replace(/[^a-z0-9]/g, '');
    return normA === normB || (normA.length > 3 && normB.length > 3 && (normA.includes(normB) || normB.includes(normA)));
  };

  let primaryDimName = '';
  let secondaryDimName: string | undefined = undefined;
  let primaryCandidates: string[] = [];
  let secondaryCandidates: string[] = [];

  if (rawXGroup) {
    primaryDimName = rawXGroup;
    primaryCandidates = getColCandidates(rawXGroupItem);
    const secItem =
      rawXAxisItems.find(c => !isSameDim(getPrimaryColName(c), rawXGroup)) ||
      rawGroupbyItems.find(c => !isSameDim(getPrimaryColName(c), rawXGroup));
    if (secItem) {
      secondaryDimName = getPrimaryColName(secItem);
      secondaryCandidates = getColCandidates(secItem);
    }
  } else if (rawXAxisList.length >= 2) {
    primaryDimName = rawXAxisList[0];
    primaryCandidates = getColCandidates(rawXAxisItems[0]);
    secondaryDimName = rawXAxisList[1];
    secondaryCandidates = getColCandidates(rawXAxisItems[1]);
  } else if (rawXAxisList.length === 1) {
    primaryDimName = rawXAxisList[0];
    primaryCandidates = getColCandidates(rawXAxisItems[0]);
    // Filter out primary from groupby if accidentally duplicated in both
    const secItem = rawGroupbyItems.find(c => !isSameDim(getPrimaryColName(c), primaryDimName));
    if (secItem) {
      secondaryDimName = getPrimaryColName(secItem);
      secondaryCandidates = getColCandidates(secItem);
    }
  } else if (rawGroupbyList.length > 0) {
    primaryDimName = rawGroupbyList[0];
    primaryCandidates = getColCandidates(rawGroupbyItems[0]);
    if (rawGroupbyList.length > 1) {
      secondaryDimName = rawGroupbyList[1];
      secondaryCandidates = getColCandidates(rawGroupbyItems[1]);
    }
  } else {
    primaryDimName = 'category';
  }

  // Enhanced row key finder matching exact, lower, and normalized
  const findRowKey = (name?: string, candidates: string[] = []): string | undefined => {
    if (rowKeys.length === 0) return undefined;
    const allSearch = [name, ...candidates].filter(Boolean) as string[];

    // 1. Exact match in rowKeys
    for (const cand of allSearch) {
      const exact = rowKeys.find(k => k === cand);
      if (exact) return exact;
    }

    // 2. Case-insensitive match in rowKeys
    for (const cand of allSearch) {
      const lower = cand.toLowerCase();
      const match = rowKeys.find(k => k.toLowerCase() === lower);
      if (match) return match;
    }

    // 3. Normalized alphanumeric match (removes spaces, underscores, dashes)
    for (const cand of allSearch) {
      const normCand = cand.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!normCand) continue;
      const match = rowKeys.find(k => {
        const normK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normK === normCand || (normCand.length > 3 && normK.length > 3 && (normK.includes(normCand) || normCand.includes(normK)));
      });
      if (match) return match;
    }

    return undefined;
  };

  const resolvedXAxis = primaryDimName;
  let actualXKey = findRowKey(primaryDimName, primaryCandidates) || primaryDimName;
  let actualBreakdownKey = findRowKey(secondaryDimName, secondaryCandidates);

  // Fallback 1: se actualXKey non è presente nelle chiavi di sampleRow, individua la prima colonna non-numerica
  if (!(actualXKey in sampleRow) && rowKeys.length > 0) {
    const candidate = rowKeys.find(
      k => k !== '__timestamp' && !k.startsWith('__') && typeof sampleRow[k] === 'string'
    );
    if (candidate) actualXKey = candidate;
  }

  // Fallback 2: se secondaryDimName è specificato ma actualBreakdownKey non è presente in sampleRow,
  // individua la colonna categorica diversa da actualXKey
  if (secondaryDimName && (!actualBreakdownKey || !(actualBreakdownKey in sampleRow)) && rowKeys.length > 0) {
    const candidate = rowKeys.find(
      k =>
        k !== actualXKey &&
        k !== '__timestamp' &&
        !k.startsWith('__') &&
        typeof sampleRow[k] === 'string'
    );
    if (candidate) actualBreakdownKey = candidate;
  }

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
