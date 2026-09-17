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
    categories,
    series,
    viewMode: initialViewMode = '3d',
    orientation: initialOrientation = 'vertical',
    stacking: initialStacking = 'none',
    tilt3D: initialTilt = 25,
    depth3D: initialDepth = 20,
    enableToolbar = true,
    onCrossFilter,
  } = props;

  // Local state for runtime interactivity
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [orientation, setOrientation] = useState<OrientationType>(initialOrientation);
  const [stacking, setStacking] = useState<StackingMode>(initialStacking);
  const [tilt3D, setTilt3D] = useState<number>(initialTilt);
  const [depth3D, setDepth3D] = useState<number>(initialDepth);

  // Synchronize when incoming props change
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
    setTilt3D(initialTilt);
  }, [initialTilt]);

  useEffect(() => {
    setDepth3D(initialDepth);
  }, [initialDepth]);

  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  // Merge runtime state with transformed props
  const effectiveProps = useMemo<StratumBarTransformedProps>(() => {
    return {
      ...props,
      viewMode,
      orientation,
      stacking,
      tilt3D,
      depth3D,
    };
  }, [props, viewMode, orientation, stacking, tilt3D, depth3D]);

  // Compute option using either 2D or 3D renderer
  const chartOption = useMemo(() => {
    if (!categories || categories.length === 0 || !series || series.length === 0) {
      return null;
    }
    if (viewMode === '3d') {
      return get3DBarOption(effectiveProps);
    }
    return get2DBarOption(effectiveProps);
  }, [effectiveProps, categories, series, viewMode]);

  // Export handlers
  const handleExportPNG = useCallback(() => {
    if (!chartInstanceRef.current) return;
    const url = chartInstanceRef.current.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    });
    const a = document.createElement('a');
    a.href = url;
    a.download = `stratum_bar_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const handleExportCSV = useCallback(() => {
    if (!categories || !series) return;
    const headers = ['Category', ...series.map(s => s.name)];
    const rows = categories.map((cat, idx) => {
      const vals = series.map(s => (s.data[idx] !== null && s.data[idx] !== undefined ? s.data[idx] : ''));
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
  }, [categories, series]);

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
          selectedCategory = categories[catIdx] || String(catIdx);
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

    return () => {
      // Intentionally keep instance alive during quick re-renders, clean up on unmount
    };
  }, [chartOption, onCrossFilter, categories]);

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

  if (!categories || categories.length === 0 || !series || series.length === 0) {
    return (
      <div className="stratum-bar-container" style={{ width, height }}>
        <div className="stratum-bar-empty">
          <span>Nessun dato disponibile da visualizzare nel grafico StratumBar.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="stratum-bar-container" style={{ width, height }}>
      {enableToolbar && (
        <div className="stratum-bar-toolbar">
          <div className="stratum-bar-toolbar-group">
            {/* View Mode Toggle */}
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

            {/* Orientation Toggle */}
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

            {/* Stacking Toggle */}
            <div className="stratum-bar-btn-group">
              <button
                type="button"
                className={`stratum-bar-btn ${stacking === 'none' ? 'active' : ''}`}
                onClick={() => setStacking('none')}
                title="Barre Raggruppate"
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
          </div>

          <div className="stratum-bar-toolbar-group">
            {/* 3D Depth & Tilt Sliders */}
            {viewMode === '3d' && (
              <>
                <label className="stratum-bar-slider-label" title="Inclinazione 3D">
                  Inclinazione:
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
                <label className="stratum-bar-slider-label" title="Profondità 3D">
                  Profondità:
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

            {/* Export Buttons */}
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
          </div>
        </div>
      )}

      <div className="stratum-bar-canvas-container" ref={chartContainerRef} />
    </div>
  );
};

export default StratumBarChart;
