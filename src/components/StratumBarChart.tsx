import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as echarts from 'echarts';
import { StratumBarTransformedProps, ViewMode, StackingMode, StratumBarSeries } from '../types';
import { get2DBarOption } from './renderers2D';
import { get3DBarOption } from './renderers3D';
import './StratumBarChart.css';

const StratumBarChart: React.FC<StratumBarTransformedProps> = props => {
  const {
    width,
    height,
    categories: initialCategories,
    series: initialSeries,
    combinedCategories,
    combinedSeries,
    breakdownDimName,
    canCombineBreakdown,
    viewMode: initialViewMode = '3d',
    orientation: initialOrientation = 'vertical',
    stacking: initialStacking = 'none',
    enableToolbar = true,
    toolbarConfig,
    hasDualYAxis: initialHasDualYAxis = false,
    combineCategoryBreakdown: initialCombineBreakdown = false,
    onCrossFilter,
  } = props;

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Runtime interactive state (client-side 60fps toggling)
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>(initialOrientation);
  const [stacking, setStacking] = useState<StackingMode>(initialStacking);
  const [hasDualYAxis, setHasDualYAxis] = useState<boolean>(initialHasDualYAxis);
  const [combineBreakdown, setCombineBreakdown] = useState<boolean>(initialCombineBreakdown);
  const [tilt3D, setTilt3D] = useState<number>(props.tilt3D ?? 25);
  const [depth3D, setDepth3D] = useState<number>(props.depth3D ?? 20);
  const [showBenchmark, setShowBenchmark] = useState<boolean>(props.showBenchmark ?? false);
  const [showSettings3D, setShowSettings3D] = useState<boolean>(false);

  // Close 3D settings popover on click outside
  useEffect(() => {
    if (!showSettings3D) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowSettings3D(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings3D]);

  // Sync with prop changes if chart controls update in Explore
  useEffect(() => {
    setViewMode(initialViewMode);
  }, [initialViewMode]);

  useEffect(() => {
    setOrientation(initialOrientation);
  }, [initialOrientation]);

  useEffect(() => {
    setStacking(initialStacking);
  }, [initialStacking]);

  useEffect(() => {
    setHasDualYAxis(initialHasDualYAxis);
  }, [initialHasDualYAxis]);

  useEffect(() => {
    setCombineBreakdown(initialCombineBreakdown);
  }, [initialCombineBreakdown]);

  useEffect(() => {
    if (props.tilt3D !== undefined) setTilt3D(props.tilt3D);
  }, [props.tilt3D]);

  useEffect(() => {
    if (props.depth3D !== undefined) setDepth3D(props.depth3D);
  }, [props.depth3D]);

  useEffect(() => {
    if (props.showBenchmark !== undefined) setShowBenchmark(props.showBenchmark);
  }, [props.showBenchmark]);

  // Select active representations based on runtime toggle
  const activeCategories = useMemo(() => {
    if (combineBreakdown && combinedCategories && combinedCategories.length > 0) {
      return combinedCategories;
    }
    return initialCategories;
  }, [combineBreakdown, combinedCategories, initialCategories]);

  const activeSeries = useMemo(() => {
    let base: StratumBarSeries[] = (combineBreakdown && combinedSeries && combinedSeries.length > 0)
      ? combinedSeries
      : initialSeries;

    if (!hasDualYAxis) {
      base = base.filter((s: StratumBarSeries) => s.yAxisIndex !== 1);
    }
    return base;
  }, [combineBreakdown, combinedSeries, initialSeries, hasDualYAxis]);

  // Support manual colors defined in Dashboard CSS via custom properties:
  // e.g. --color-ssn: #3a6a9b; or --stratum-color-ssn: #3a6a9b;
  const seriesWithCssOverrides = useMemo(() => {
    if (!chartContainerRef.current) return activeSeries;
    try {
      const computed = window.getComputedStyle(chartContainerRef.current);
      return activeSeries.map(s => {
        const key = s.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const candidates = [
          `--color-${key}`,
          `--stratum-color-${key}`,
          `--${key}-color`,
          `--color-${s.key.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        ];
        for (const c of candidates) {
          const val = computed.getPropertyValue(c)?.trim();
          if (val) {
            return { ...s, color: val };
          }
        }
        return s;
      });
    } catch {
      return activeSeries;
    }
  }, [activeSeries]);

  // Merge runtime state into effective props passed to renderers
  const effectiveProps = useMemo(() => {
    return {
      ...props,
      categories: activeCategories,
      series: seriesWithCssOverrides,
      viewMode,
      orientation,
      stacking,
      tilt3D,
      depth3D,
      hasDualYAxis,
      showBenchmark,
      benchmark: showBenchmark ? props.benchmark : undefined,
      selectedValues: props.selectedValues,
    };
  }, [props, activeCategories, seriesWithCssOverrides, viewMode, orientation, stacking, tilt3D, depth3D, hasDualYAxis, showBenchmark]);

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
    const headers = ['Category', ...activeSeries.map((s: StratumBarSeries) => s.name)];
    const rows = activeCategories.map((cat: string, idx: number) => {
      const vals = activeSeries.map((s: StratumBarSeries) => (s.data[idx] !== null && s.data[idx] !== undefined ? s.data[idx] : ''));
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
      const chosenRenderer = props.renderer === 'svg' ? 'svg' : 'canvas';
      chartInstanceRef.current = echarts.init(chartContainerRef.current, undefined, {
        renderer: chosenRenderer,
      });

      chartInstanceRef.current.on('click', (params: any) => {
        if (!onCrossFilter) return;
        let selectedCategory = '';
        let selectedSeriesName = '';

        if (params.name) {
          selectedCategory = params.name;
        } else if (params.data && typeof params.data === 'object' && !Array.isArray(params.data) && params.data.name) {
          selectedCategory = params.data.name;
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
  }, [chartOption, activeCategories, onCrossFilter, props.renderer]);

  // Handle auto-resize
  useEffect(() => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.resize({ width, height: enableToolbar ? height - 36 : height });
    }
  }, [width, height, enableToolbar]);

  // Cleanup
  useEffect(() => {
    return () => {
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, []);

  if (!activeCategories || activeCategories.length === 0 || !activeSeries || activeSeries.length === 0) {
    return (
      <div className={`stratum-bar-container ${props.themeMode === 'dark' ? 'dark' : ''}`} style={{ width, height }}>
        <div className="stratum-bar-empty">
          <span>Nessun dato disponibile da visualizzare nel grafico StratumBar.</span>
        </div>
      </div>
    );
  }

  const hasSecondarySeries = initialHasDualYAxis || initialSeries.some((s: StratumBarSeries) => s.yAxisIndex === 1);

  return (
    <div
      className={`stratum-bar-container ${props.themeMode === 'dark' ? 'dark' : ''} ${props.selectedValues && props.selectedValues.length > 0 ? 'is-filtered' : ''}`}
      style={{ width, height }}
      data-selected-values={props.selectedValues?.join(',')}
    >
      {enableToolbar && (
        <div className="stratum-bar-toolbar">
          <div className="stratum-bar-toolbar-left">
            {/* View Mode Switcher: 2D / 3D */}
            {toolbarConfig?.showViewMode !== false && (
              <div className="stratum-bar-segmented">
                <button
                  type="button"
                  className={`stratum-bar-btn ${viewMode === '2d' ? 'active' : ''}`}
                  onClick={() => setViewMode('2d')}
                  title="2D Moderno (Curved)"
                >
                  2D
                </button>
                <button
                  type="button"
                  className={`stratum-bar-btn ${viewMode === '3d' ? 'active' : ''}`}
                  onClick={() => setViewMode('3d')}
                  title="3D Isometrico Volumetrico"
                >
                  3D
                </button>
              </div>
            )}

            {/* Orientation Switch: Vertical / Horizontal */}
            {toolbarConfig?.showOrientation !== false && (
              <button
                type="button"
                className={`stratum-bar-btn ${orientation === 'horizontal' ? 'active' : ''}`}
                onClick={() => setOrientation(prev => (prev === 'vertical' ? 'horizontal' : 'vertical'))}
                title={orientation === 'vertical' ? 'Orientamento: Verticale (clicca per Orizzontale)' : 'Orientamento: Orizzontale (clicca per Verticale)'}
              >
                {orientation === 'vertical' ? '↕ Colonne' : '↔ Barre'}
              </button>
            )}

            {/* Stacking Switch: Grouped / Stacked */}
            {toolbarConfig?.showStacking !== false && (
              <button
                type="button"
                className={`stratum-bar-btn ${stacking === 'stack' ? 'active' : ''}`}
                onClick={() => setStacking(prev => (prev === 'none' ? 'stack' : 'none'))}
                title={stacking === 'none' ? 'Disposizione: Raggruppate (clicca per Impilare)' : 'Disposizione: Impilate (clicca per Raggruppare)'}
              >
                {stacking === 'stack' ? '☷ Impilate' : '☷ Affiancate'}
              </button>
            )}

            {/* Dual Y-Axis Micro-Pill */}
            {toolbarConfig?.showDualAxis !== false && hasSecondarySeries && (
              <button
                type="button"
                className={`stratum-bar-btn ${hasDualYAxis ? 'active-secondary' : ''}`}
                onClick={() => setHasDualYAxis(prev => !prev)}
                title="Attiva/Disattiva Secondo Asse Y a runtime"
              >
                <span className={`stratum-bar-dot ${hasDualYAxis ? 'dot-orange' : 'dot-off'}`} /> Asse 2
              </button>
            )}

            {/* Dynamic Breakdown Micro-Pill */}
            {toolbarConfig?.showBreakdownToggle !== false && canCombineBreakdown && (
              <button
                type="button"
                className={`stratum-bar-btn ${combineBreakdown ? 'active-accent' : ''}`}
                onClick={() => setCombineBreakdown(prev => !prev)}
                title={`Unifica o separa la dimensione "${breakdownDimName || 'Breakdown'}" sull'asse X`}
              >
                <span className={`stratum-bar-dot ${combineBreakdown ? 'dot-green' : 'dot-off'}`} /> {breakdownDimName ? `Combina ${breakdownDimName}` : 'Combina'}
              </button>
            )}

            {/* Benchmark Target Micro-Pill */}
            {toolbarConfig?.showBenchmark !== false && props.benchmark && (
              <button
                type="button"
                className={`stratum-bar-btn ${showBenchmark ? 'active' : ''}`}
                onClick={() => setShowBenchmark(prev => !prev)}
                title="Mostra/Nascondi soglia benchmark target a runtime"
              >
                <span className={`stratum-bar-dot ${showBenchmark ? 'dot-blue' : 'dot-off'}`} /> Target
              </button>
            )}
          </div>

          <div className="stratum-bar-toolbar-right">
            {/* 3D Depth & Tilt Mini Settings Popover */}
            {viewMode === '3d' && (
              <div className="stratum-bar-popover-wrapper" ref={popoverRef}>
                <button
                  type="button"
                  className={`stratum-bar-btn ${showSettings3D ? 'active' : ''}`}
                  onClick={() => setShowSettings3D(prev => !prev)}
                  title="Parametri 3D (Inclinazione & Profondità)"
                >
                  ⚙️ 3D
                </button>
                {showSettings3D && (
                  <div className="stratum-bar-popover">
                    <div className="stratum-bar-popover-row">
                      <span>Inclinazione</span>
                      <input
                        type="range"
                        min="10"
                        max="60"
                        value={tilt3D}
                        className="stratum-bar-slider"
                        onChange={e => setTilt3D(Number(e.target.value))}
                      />
                      <span className="stratum-bar-val">{tilt3D}°</span>
                    </div>
                    <div className="stratum-bar-popover-row">
                      <span>Profondità</span>
                      <input
                        type="range"
                        min="8"
                        max="45"
                        value={depth3D}
                        className="stratum-bar-slider"
                        onChange={e => setDepth3D(Number(e.target.value))}
                      />
                      <span className="stratum-bar-val">{depth3D}px</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Export Micro-Buttons */}
            {toolbarConfig?.showExport !== false && (
              <div className="stratum-bar-segmented">
                <button
                  type="button"
                  className="stratum-bar-btn stratum-bar-icon-btn"
                  onClick={handleExportPNG}
                  title="Esporta immagine PNG ad alta risoluzione"
                >
                  📷
                </button>
                <button
                  type="button"
                  className="stratum-bar-btn stratum-bar-icon-btn"
                  onClick={handleExportCSV}
                  title="Esporta dati in formato CSV"
                >
                  📊
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="stratum-bar-canvas-container" ref={chartContainerRef} />
    </div>
  );
};

export default StratumBarChart;
