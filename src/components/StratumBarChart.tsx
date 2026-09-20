import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as echarts from 'echarts';
import {
  StratumBarTransformedProps,
  ViewMode,
  OrientationType,
  StackingMode,
} from '../types';
import { get2DBarOption } from './renderers2D';
import { get3DBarOption } from './renderers3D';
import './StratumBarChart.css';

export const StratumBarChart: React.FC<StratumBarTransformedProps> = props => {
  const {
    width,
    height,
    categories: initialCategories,
    series: initialSeries,
    viewMode: initialViewMode = '3d',
    orientation: initialOrientation = 'vertical',
    stacking: initialStacking = 'none',
    tilt3D: initialTilt = 25,
    depth3D: initialDepth = 20,
    enableToolbar = true,
    hasDualYAxis: initialHasDualYAxis = false,
    combineCategoryBreakdown: initialCombineBreakdown = false,
    showBenchmark: initialShowBenchmark = false,
    canCombineBreakdown = false,
    breakdownDimName,
    combinedCategories,
    combinedSeries,
    standardCategories,
    standardSeries,
    toolbarConfig,
    onCrossFilter,
  } = props;

  // Local state for runtime interactivity
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [orientation, setOrientation] = useState<OrientationType>(initialOrientation);
  const [stacking, setStacking] = useState<StackingMode>(initialStacking);
  const [tilt3D, setTilt3D] = useState<number>(initialTilt);
  const [depth3D, setDepth3D] = useState<number>(initialDepth);
  const [hasDualYAxis, setHasDualYAxis] = useState<boolean>(initialHasDualYAxis);
  const [combineBreakdown, setCombineBreakdown] = useState<boolean>(initialCombineBreakdown);
  const [showBenchmark, setShowBenchmark] = useState<boolean>(initialShowBenchmark);

  // Synchronize when incoming props change from Superset Explore
  useEffect(() => { setViewMode(initialViewMode); }, [initialViewMode]);
  useEffect(() => { setOrientation(initialOrientation); }, [initialOrientation]);
  useEffect(() => { setStacking(initialStacking); }, [initialStacking]);
  useEffect(() => { setTilt3D(initialTilt); }, [initialTilt]);
  useEffect(() => { setDepth3D(initialDepth); }, [initialDepth]);
  useEffect(() => { setHasDualYAxis(initialHasDualYAxis); }, [initialHasDualYAxis]);
  useEffect(() => { setCombineBreakdown(initialCombineBreakdown); }, [initialCombineBreakdown]);
  useEffect(() => { setShowBenchmark(initialShowBenchmark); }, [initialShowBenchmark]);

  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  // Dynamically switch categories and series when combineBreakdown or hasDualYAxis is toggled
  const activeCategories = useMemo(() => {
    if (canCombineBreakdown && combineBreakdown && combinedCategories && combinedCategories.length > 0) {
      return combinedCategories;
    }
    if (canCombineBreakdown && !combineBreakdown && standardCategories && standardCategories.length > 0) {
      return standardCategories;
    }
    return initialCategories;
  }, [canCombineBreakdown, combineBreakdown, combinedCategories, standardCategories, initialCategories]);

  const activeSeries = useMemo(() => {
    let sList = initialSeries;
    if (canCombineBreakdown && combineBreakdown && combinedSeries && combinedSeries.length > 0) {
      sList = combinedSeries;
    } else if (canCombineBreakdown && !combineBreakdown && standardSeries && standardSeries.length > 0) {
      sList = standardSeries;
    }

    if (!hasDualYAxis) {
      return sList.filter(s => s.yAxisIndex !== 1);
    }
    return sList;
  }, [canCombineBreakdown, combineBreakdown, combinedSeries, standardSeries, initialSeries, hasDualYAxis]);

  // Merge runtime state with transformed props
  const effectiveProps = useMemo<StratumBarTransformedProps>(() => {
    return {
      ...props,
      categories: activeCategories,
      series: activeSeries,
      viewMode,
      orientation,
      stacking,
      tilt3D,
      depth3D,
      hasDualYAxis,
      showBenchmark,
      benchmark: showBenchmark ? props.benchmark : undefined,
    };
  }, [props, activeCategories, activeSeries, viewMode, orientation, stacking, tilt3D, depth3D, hasDualYAxis, showBenchmark]);

  // Compute option using either 2D or 3D renderer
  const chartOption = useMemo(() => {
    if (!activeCategories || activeCategories.length === 0 || !activeSeries || activeSeries.length === 0) {
      return null;
    }
    if (viewMode === '3d') {
      return get3DBarOption(effectiveProps);
    }
    return get2DBarOption(effectiveProps);
  }, [effectiveProps, activeCategories, activeSeries, viewMode]);

  // Export handlers
  const handleExportPNG = useCallback(() => {
    if (!chartInstanceRef.current) return;
    const url = chartInstanceRef.current.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: props.themeMode === 'dark' ? '#111827' : '#ffffff',
    });
    const a = document.createElement('a');
    a.href = url;
    a.download = `stratum_bar_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [props.themeMode]);

  const handleExportCSV = useCallback(() => {
    if (!activeCategories || !activeSeries) return;
    const headers = ['Category', ...activeSeries.map(s => s.name)];
    const rows = activeCategories.map((cat, idx) => {
      const vals = activeSeries.map(s => (s.data[idx] !== null && s.data[idx] !== undefined ? s.data[idx] : ''));
      return [cat, ...vals].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const a = document.createElement('a');
    a.href = encodedUri;
    a.download = `stratum_bar_data_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [activeCategories, activeSeries]);

  // Mount and update ECharts
  useEffect(() => {
    if (!chartContainerRef.current) return;

    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartContainerRef.current, undefined, {
        renderer: 'canvas',
      });

      chartInstanceRef.current.on('click', (params: any) => {
        if (!onCrossFilter) return;
        let selectedCategory = '';
        let selectedSeriesName = '';

        if (params.name) {
          selectedCategory = params.name;
        } else if (params.data && Array.isArray(params.data) && params.data[0] !== undefined) {
          const catIdx = params.data[0];
          selectedCategory = activeCategories[catIdx] || String(catIdx);
        }
        if (params.seriesName) {
          selectedSeriesName = params.seriesName;
        }

        if (selectedCategory) {
          onCrossFilter(selectedCategory, selectedSeriesName);
        }
      });
    }

    if (chartOption) {
      chartInstanceRef.current.setOption(chartOption as any, true);
      chartInstanceRef.current.resize();
    }
  }, [chartOption, onCrossFilter, activeCategories]);

  // Handle container resize
  useEffect(() => {
    if (!chartContainerRef.current || !chartInstanceRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      chartInstanceRef.current?.resize();
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Cleanup chart on full unmount
  useEffect(() => {
    return () => {
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, []);

  if (!activeCategories || activeCategories.length === 0 || !activeSeries || activeSeries.length === 0) {
    return (
      <div className="stratum-bar-container" style={{ width, height }}>
        <div className="stratum-bar-empty">
          <span>Nessun dato disponibile da visualizzare nel grafico StratumBar.</span>
        </div>
      </div>
    );
  }

  const hasSecondarySeries = initialHasDualYAxis || initialSeries.some(s => s.yAxisIndex === 1);

  return (
    <div className="stratum-bar-container" style={{ width, height }}>
      {enableToolbar && (
        <div className="stratum-bar-toolbar">
          <div className="stratum-bar-toolbar-group">
            {/* View Mode Toggle */}
            {toolbarConfig?.showViewMode !== false && (
              <div className="stratum-bar-btn-group">
                <button
                  type="button"
                  className={`stratum-bar-btn ${viewMode === '2d' ? 'active' : ''}`}
                  onClick={() => setViewMode('2d')}
                  title="Visualizzazione 2D Moderna"
                >
                  2D
                </button>
                <button
                  type="button"
                  className={`stratum-bar-btn ${viewMode === '3d' ? 'active' : ''}`}
                  onClick={() => setViewMode('3d')}
                  title="Visualizzazione 3D Isometrica"
                >
                  3D
                </button>
              </div>
            )}

            {/* Orientation Toggle */}
            {toolbarConfig?.showOrientation !== false && (
              <div className="stratum-bar-btn-group">
                <button
                  type="button"
                  className={`stratum-bar-btn ${orientation === 'vertical' ? 'active' : ''}`}
                  onClick={() => setOrientation('vertical')}
                  title="Orientamento Verticale (Colonne)"
                >
                  Verticale
                </button>
                <button
                  type="button"
                  className={`stratum-bar-btn ${orientation === 'horizontal' ? 'active' : ''}`}
                  onClick={() => setOrientation('horizontal')}
                  title="Orientamento Orizzontale (Barre)"
                >
                  Orizzontale
                </button>
              </div>
            )}

            {/* Stacking Toggle */}
            {toolbarConfig?.showStacking !== false && (
              <div className="stratum-bar-btn-group">
                <button
                  type="button"
                  className={`stratum-bar-btn ${stacking === 'none' ? 'active' : ''}`}
                  onClick={() => setStacking('none')}
                  title="Barre Raggruppate Affiancate"
                >
                  Raggruppate
                </button>
                <button
                  type="button"
                  className={`stratum-bar-btn ${stacking === 'stack' ? 'active' : ''}`}
                  onClick={() => setStacking('stack')}
                  title="Barre Impilate"
                >
                  Impilate
                </button>
              </div>
            )}

            {/* Dual Y-Axis Toggle (Only rendered if secondary metrics are configured) */}
            {toolbarConfig?.showDualAxis !== false && hasSecondarySeries && (
              <div className="stratum-bar-btn-group">
                <button
                  type="button"
                  className={`stratum-bar-btn ${hasDualYAxis ? 'active-secondary' : ''}`}
                  onClick={() => setHasDualYAxis(prev => !prev)}
                  title="Attiva/Disattiva Secondo Asse Y a Runtime"
                >
                  Doppio Asse Y: {hasDualYAxis ? 'ON' : 'OFF'}
                </button>
              </div>
            )}

            {/* Dynamic Universal Breakdown Toggle (Only rendered if a breakdown dimension is present) */}
            {toolbarConfig?.showBreakdownToggle !== false && canCombineBreakdown && (
              <div className="stratum-bar-btn-group">
                <button
                  type="button"
                  className={`stratum-bar-btn ${combineBreakdown ? 'active-accent' : ''}`}
                  onClick={() => setCombineBreakdown(prev => !prev)}
                  title={`Unifica o separa la dimensione "${breakdownDimName || 'Breakdown'}" sull'asse`}
                >
                  {breakdownDimName ? `Combina ${breakdownDimName}` : 'Combina Dimensione'}: {combineBreakdown ? 'ON' : 'OFF'}
                </button>
              </div>
            )}
          </div>

          <div className="stratum-bar-toolbar-group">
            {/* 3D Depth & Tilt Sliders */}
            {viewMode === '3d' && (
              <>
                <label className="stratum-bar-slider-label" title="Inclinazione Angolare 3D">
                  Tilt:
                  <input
                    type="range"
                    min="10"
                    max="60"
                    value={tilt3D}
                    className="stratum-bar-slider"
                    onChange={e => setTilt3D(Number(e.target.value))}
                  />
                  <span>{tilt3D}°</span>
                </label>
                <label className="stratum-bar-slider-label" title="Profondità Volumetrica 3D">
                  Depth:
                  <input
                    type="range"
                    min="8"
                    max="45"
                    value={depth3D}
                    className="stratum-bar-slider"
                    onChange={e => setDepth3D(Number(e.target.value))}
                  />
                  <span>{depth3D}px</span>
                </label>
              </>
            )}

            {/* Benchmark Toggle (Only rendered if benchmark is configured) */}
            {toolbarConfig?.showBenchmark !== false && props.benchmark && (
              <div className="stratum-bar-btn-group">
                <button
                  type="button"
                  className={`stratum-bar-btn ${showBenchmark ? 'active' : ''}`}
                  onClick={() => setShowBenchmark(prev => !prev)}
                  title="Mostra/Nascondi soglia benchmark a runtime"
                >
                  Target: {showBenchmark ? 'ON' : 'OFF'}
                </button>
              </div>
            )}

            {/* Export Buttons */}
            {toolbarConfig?.showExport !== false && (
              <>
                <button
                  type="button"
                  className="stratum-bar-export-btn"
                  onClick={handleExportPNG}
                  title="Esporta immagine PNG ad alta risoluzione"
                >
                  📷 PNG
                </button>
                <button
                  type="button"
                  className="stratum-bar-export-btn"
                  onClick={handleExportCSV}
                  title="Esporta dati in formato CSV"
                >
                  📊 CSV
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="stratum-bar-canvas-container" ref={chartContainerRef} />
    </div>
  );
};

export default StratumBarChart;
