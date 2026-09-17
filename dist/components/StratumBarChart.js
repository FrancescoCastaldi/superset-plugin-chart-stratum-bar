import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as echarts from 'echarts';
import { get2DBarOption } from './renderers2D';
import { get3DBarOption } from './renderers3D';
import './StratumBarChart.css';
export const StratumBarChart = props => {
    const { width, height, categories, series, viewMode: initialViewMode = '3d', orientation: initialOrientation = 'vertical', stacking: initialStacking = 'none', tilt3D: initialTilt = 25, depth3D: initialDepth = 20, enableToolbar = true, onCrossFilter, } = props;
    // Local state for runtime interactivity
    const [viewMode, setViewMode] = useState(initialViewMode);
    const [orientation, setOrientation] = useState(initialOrientation);
    const [stacking, setStacking] = useState(initialStacking);
    const [tilt3D, setTilt3D] = useState(initialTilt);
    const [depth3D, setDepth3D] = useState(initialDepth);
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
    const chartContainerRef = useRef(null);
    const chartInstanceRef = useRef(null);
    // Merge runtime state with transformed props
    const effectiveProps = useMemo(() => {
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
        if (!chartInstanceRef.current)
            return;
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
        if (!categories || !series)
            return;
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
        if (!chartContainerRef.current)
            return;
        if (!chartInstanceRef.current) {
            chartInstanceRef.current = echarts.init(chartContainerRef.current, undefined, {
                renderer: 'canvas',
            });
            chartInstanceRef.current.on('click', (params) => {
                if (!onCrossFilter)
                    return;
                let selectedCategory = '';
                let selectedSeriesName = '';
                if (params.name) {
                    selectedCategory = params.name;
                }
                else if (params.data && Array.isArray(params.data) && params.data[0] !== undefined) {
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
            chartInstanceRef.current.setOption(chartOption, true);
            chartInstanceRef.current.resize();
        }
        return () => {
            // Intentionally keep instance alive during quick re-renders, clean up on unmount
        };
    }, [chartOption, onCrossFilter, categories]);
    // Handle container resize
    useEffect(() => {
        if (!chartContainerRef.current || !chartInstanceRef.current)
            return;
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
        return (_jsx("div", { className: "stratum-bar-container", style: { width, height }, children: _jsx("div", { className: "stratum-bar-empty", children: _jsx("span", { children: "Nessun dato disponibile da visualizzare nel grafico StratumBar." }) }) }));
    }
    return (_jsxs("div", { className: "stratum-bar-container", style: { width, height }, children: [enableToolbar && (_jsxs("div", { className: "stratum-bar-toolbar", children: [_jsxs("div", { className: "stratum-bar-toolbar-group", children: [_jsxs("div", { className: "stratum-bar-btn-group", children: [_jsx("button", { type: "button", className: `stratum-bar-btn ${viewMode === '2d' ? 'active' : ''}`, onClick: () => setViewMode('2d'), title: "Visualizzazione 2D Moderna", children: "2D" }), _jsx("button", { type: "button", className: `stratum-bar-btn ${viewMode === '3d' ? 'active' : ''}`, onClick: () => setViewMode('3d'), title: "Visualizzazione 3D Isometrica", children: "3D" })] }), _jsxs("div", { className: "stratum-bar-btn-group", children: [_jsx("button", { type: "button", className: `stratum-bar-btn ${orientation === 'vertical' ? 'active' : ''}`, onClick: () => setOrientation('vertical'), title: "Orientamento Verticale (Colonne)", children: "Verticale" }), _jsx("button", { type: "button", className: `stratum-bar-btn ${orientation === 'horizontal' ? 'active' : ''}`, onClick: () => setOrientation('horizontal'), title: "Orientamento Orizzontale (Barre)", children: "Orizzontale" })] }), _jsxs("div", { className: "stratum-bar-btn-group", children: [_jsx("button", { type: "button", className: `stratum-bar-btn ${stacking === 'none' ? 'active' : ''}`, onClick: () => setStacking('none'), title: "Barre Raggruppate", children: "Raggruppate" }), _jsx("button", { type: "button", className: `stratum-bar-btn ${stacking === 'stack' ? 'active' : ''}`, onClick: () => setStacking('stack'), title: "Barre Impilate", children: "Impilate" })] })] }), _jsxs("div", { className: "stratum-bar-toolbar-group", children: [viewMode === '3d' && (_jsxs(_Fragment, { children: [_jsxs("label", { className: "stratum-bar-slider-label", title: "Inclinazione 3D", children: ["Inclinazione:", _jsx("input", { type: "range", min: "10", max: "60", value: tilt3D, className: "stratum-bar-slider", onChange: e => setTilt3D(Number(e.target.value)) }), _jsxs("span", { children: [tilt3D, "\u00B0"] })] }), _jsxs("label", { className: "stratum-bar-slider-label", title: "Profondit\u00E0 3D", children: ["Profondit\u00E0:", _jsx("input", { type: "range", min: "8", max: "45", value: depth3D, className: "stratum-bar-slider", onChange: e => setDepth3D(Number(e.target.value)) }), _jsxs("span", { children: [depth3D, "px"] })] })] })), _jsx("button", { type: "button", className: "stratum-bar-export-btn", onClick: handleExportPNG, title: "Esporta immagine PNG ad alta risoluzione", children: "\uD83D\uDCF7 PNG" }), _jsx("button", { type: "button", className: "stratum-bar-export-btn", onClick: handleExportCSV, title: "Esporta dati in formato CSV", children: "\uD83D\uDCCA CSV" })] })] })), _jsx("div", { className: "stratum-bar-canvas-container", ref: chartContainerRef })] }));
};
export default StratumBarChart;
//# sourceMappingURL=StratumBarChart.js.map