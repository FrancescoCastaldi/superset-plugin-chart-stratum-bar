import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import * as echarts from 'echarts';
import { get2DBarOption } from './renderers2D';
import { get3DBarOption } from './renderers3D';
import './StratumBarChart.css';
const StratumBarChart = props => {
    const { width, height, categories: initialCategories, series: initialSeries, combinedCategories, combinedSeries, breakdownDimName, canCombineBreakdown, viewMode: initialViewMode = '3d', orientation: initialOrientation = 'vertical', stacking: initialStacking = 'none', barShape3D: initialBarShape3D = 'prism', enableToolbar = true, toolbarConfig, hasDualYAxis: initialHasDualYAxis = false, combineCategoryBreakdown: initialCombineBreakdown = false, onCrossFilter, } = props;
    const chartContainerRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const popoverRef = useRef(null);
    const btn3DRef = useRef(null);
    const currentRendererRef = useRef(props.renderer === 'svg' ? 'svg' : 'canvas');
    const [popoverPos, setPopoverPos] = useState(null);
    // Runtime interactive state (client-side 60fps toggling)
    const [viewMode, setViewMode] = useState(initialViewMode);
    const [orientation, setOrientation] = useState(initialOrientation);
    const [stacking, setStacking] = useState(initialStacking);
    const [hasDualYAxis, setHasDualYAxis] = useState(initialHasDualYAxis);
    const [combineBreakdown, setCombineBreakdown] = useState(initialCombineBreakdown);
    const [tilt3D, setTilt3D] = useState(props.tilt3D ?? 25);
    const [depth3D, setDepth3D] = useState(props.depth3D ?? 20);
    const [barShape3D, setBarShape3D] = useState(initialBarShape3D);
    const [showBenchmark, setShowBenchmark] = useState(props.showBenchmark ?? false);
    const [enableAxisBreak, setEnableAxisBreak] = useState(props.enableAxisBreak ?? false);
    const [valuePosition, setValuePosition] = useState(props.valuePosition || 'top');
    const [showSettings3D, setShowSettings3D] = useState(false);
    // Toggle 3D settings popover — compute absolute screen position via Portal
    const handleToggle3D = useCallback(() => {
        if (showSettings3D) {
            setShowSettings3D(false);
            setPopoverPos(null);
            return;
        }
        if (btn3DRef.current) {
            const rect = btn3DRef.current.getBoundingClientRect();
            setPopoverPos({
                top: rect.bottom + window.scrollY + 6,
                left: rect.right + window.scrollX,
            });
        }
        setShowSettings3D(true);
    }, [showSettings3D]);
    // Close 3D settings popover on click outside (portal-safe)
    useEffect(() => {
        if (!showSettings3D)
            return;
        const handleClickOutside = (e) => {
            const target = e.target;
            const clickedButton = btn3DRef.current?.contains(target);
            const clickedPopover = popoverRef.current?.contains(target);
            if (!clickedButton && !clickedPopover) {
                setShowSettings3D(false);
                setPopoverPos(null);
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
        if (props.tilt3D !== undefined)
            setTilt3D(props.tilt3D);
    }, [props.tilt3D]);
    useEffect(() => {
        if (props.depth3D !== undefined)
            setDepth3D(props.depth3D);
    }, [props.depth3D]);
    useEffect(() => {
        if (props.showBenchmark !== undefined)
            setShowBenchmark(props.showBenchmark);
    }, [props.showBenchmark]);
    useEffect(() => {
        setBarShape3D(initialBarShape3D);
    }, [initialBarShape3D]);
    useEffect(() => {
        if (props.enableAxisBreak !== undefined)
            setEnableAxisBreak(props.enableAxisBreak);
    }, [props.enableAxisBreak]);
    useEffect(() => {
        if (props.valuePosition) {
            setValuePosition(props.valuePosition);
        }
    }, [props.valuePosition]);
    // Select active representations based on runtime toggle
    const activeCategories = useMemo(() => {
        if (combineBreakdown && combinedCategories && combinedCategories.length > 0) {
            return combinedCategories;
        }
        return initialCategories;
    }, [combineBreakdown, combinedCategories, initialCategories]);
    const activeSeries = useMemo(() => {
        let base = (combineBreakdown && combinedSeries && combinedSeries.length > 0)
            ? combinedSeries
            : initialSeries;
        if (!hasDualYAxis) {
            base = base.filter((s) => s.yAxisIndex !== 1);
        }
        return base;
    }, [combineBreakdown, combinedSeries, initialSeries, hasDualYAxis]);
    // Support manual colors defined in Dashboard CSS via custom properties:
    // e.g. --color-ssn: #3a6a9b; or --stratum-color-ssn: #3a6a9b;
    const seriesWithCssOverrides = useMemo(() => {
        if (!chartContainerRef.current)
            return activeSeries;
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
        }
        catch {
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
            barShape3D,
            hasDualYAxis,
            showBenchmark,
            benchmark: showBenchmark ? props.benchmark : undefined,
            enableAxisBreak,
            selectedValues: props.selectedValues,
            valuePosition,
        };
    }, [props, activeCategories, seriesWithCssOverrides, viewMode, orientation, stacking, tilt3D, depth3D, barShape3D, hasDualYAxis, showBenchmark, enableAxisBreak, valuePosition]);
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
        if (!chartInstanceRef.current)
            return;
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
        if (!activeCategories || !activeSeries)
            return;
        const headers = ['Category', ...activeSeries.map((s) => s.name)];
        const rows = activeCategories.map((cat, idx) => {
            const vals = activeSeries.map((s) => (s.data[idx] !== null && s.data[idx] !== undefined ? s.data[idx] : ''));
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
        if (!chartContainerRef.current)
            return;
        const chosenRenderer = props.renderer === 'svg' ? 'svg' : 'canvas';
        // If renderer changed, dispose of old instance so ECharts creates the new canvas or svg engine
        if (chartInstanceRef.current && currentRendererRef.current !== chosenRenderer) {
            chartInstanceRef.current.dispose();
            chartInstanceRef.current = null;
        }
        if (!chartInstanceRef.current) {
            currentRendererRef.current = chosenRenderer;
            chartInstanceRef.current = echarts.init(chartContainerRef.current, undefined, {
                renderer: chosenRenderer,
            });
            chartInstanceRef.current.on('click', (params) => {
                if (!onCrossFilter)
                    return;
                let selectedCategory = '';
                let selectedSeriesName = '';
                if (params.name) {
                    selectedCategory = params.name;
                }
                else if (params.data && typeof params.data === 'object' && !Array.isArray(params.data) && params.data.name) {
                    selectedCategory = params.data.name;
                }
                else if (params.data && Array.isArray(params.data) && params.data[0] !== undefined) {
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
            chartInstanceRef.current.setOption(chartOption, true);
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
        return (_jsx("div", { className: `stratum-bar-container ${props.themeMode === 'dark' ? 'dark' : ''}`, style: { width, height }, children: _jsx("div", { className: "stratum-bar-empty", children: _jsx("span", { children: "Nessun dato disponibile da visualizzare nel grafico StratumBar." }) }) }));
    }
    const hasSecondarySeries = initialHasDualYAxis || initialSeries.some((s) => s.yAxisIndex === 1);
    return (_jsxs("div", { className: `stratum-bar-container ${props.themeMode === 'dark' ? 'dark' : ''} ${props.selectedValues && props.selectedValues.length > 0 ? 'is-filtered' : ''}`, style: { width, height }, "data-selected-values": props.selectedValues?.join(','), children: [enableToolbar && (_jsxs("div", { className: "stratum-bar-toolbar", children: [_jsxs("div", { className: "stratum-bar-toolbar-left", children: [toolbarConfig?.showViewMode !== false && (_jsxs("div", { className: "stratum-bar-segmented", children: [_jsx("button", { type: "button", className: `stratum-bar-btn ${viewMode === '2d' ? 'active' : ''}`, onClick: () => setViewMode('2d'), title: "2D Moderno (Curved)", children: "2D" }), _jsx("button", { type: "button", className: `stratum-bar-btn ${viewMode === '3d' ? 'active' : ''}`, onClick: () => setViewMode('3d'), title: "3D Isometrico Volumetrico", children: "3D" })] })), toolbarConfig?.showOrientation !== false && (_jsx("button", { type: "button", className: `stratum-bar-btn ${orientation === 'horizontal' ? 'active' : ''}`, onClick: () => setOrientation(prev => (prev === 'vertical' ? 'horizontal' : 'vertical')), title: orientation === 'vertical' ? 'Orientamento: Verticale (clicca per Orizzontale)' : 'Orientamento: Orizzontale (clicca per Verticale)', children: orientation === 'vertical' ? '↕ Colonne' : '↔ Barre' })), toolbarConfig?.showStacking !== false && (_jsx("button", { type: "button", className: `stratum-bar-btn ${stacking === 'stack' ? 'active' : ''}`, onClick: () => setStacking(prev => (prev === 'none' ? 'stack' : 'none')), title: stacking === 'none' ? 'Disposizione: Raggruppate (clicca per Impilare)' : 'Disposizione: Impilate (clicca per Raggruppare)', children: stacking === 'stack' ? '☷ Impilate' : '☷ Affiancate' })), toolbarConfig?.showDualAxis !== false && hasSecondarySeries && (_jsxs("button", { type: "button", className: `stratum-bar-btn ${hasDualYAxis ? 'active-secondary' : ''}`, onClick: () => setHasDualYAxis(prev => !prev), title: "Attiva/Disattiva Secondo Asse Y a runtime", children: [_jsx("span", { className: `stratum-bar-dot ${hasDualYAxis ? 'dot-orange' : 'dot-off'}` }), " Asse 2"] })), toolbarConfig?.showBreakdownToggle !== false && canCombineBreakdown && (_jsxs("button", { type: "button", className: `stratum-bar-btn ${combineBreakdown ? 'active-accent' : ''}`, onClick: () => setCombineBreakdown(prev => !prev), title: `Unifica o separa la dimensione "${breakdownDimName || 'Breakdown'}" sull'asse X`, children: [_jsx("span", { className: `stratum-bar-dot ${combineBreakdown ? 'dot-green' : 'dot-off'}` }), " ", breakdownDimName ? `Combina ${breakdownDimName}` : 'Combina'] })), toolbarConfig?.showBenchmark !== false && props.benchmark && (_jsxs("button", { type: "button", className: `stratum-bar-btn ${showBenchmark ? 'active' : ''}`, onClick: () => setShowBenchmark(prev => !prev), title: "Mostra/Nascondi soglia benchmark target a runtime", children: [_jsx("span", { className: `stratum-bar-dot ${showBenchmark ? 'dot-blue' : 'dot-off'}` }), " Target"] })), toolbarConfig?.showAxisBreak !== false && (_jsxs("button", { type: "button", className: `stratum-bar-btn ${enableAxisBreak ? 'active-accent' : ''}`, onClick: () => setEnableAxisBreak(prev => !prev), title: "Attiva/Disattiva scala spezzata (capping visivo outlier // per esaltare barre minori)", children: [_jsx("span", { className: `stratum-bar-dot ${enableAxisBreak ? 'dot-purple' : 'dot-off'}` }), " \u2702\uFE0F Asse Spezzato"] })), _jsxs("button", { type: "button", className: `stratum-bar-btn ${valuePosition !== 'top' ? 'active-secondary' : ''}`, onClick: () => {
                                    setValuePosition(prev => {
                                        if (prev === 'top' || prev === 'outside')
                                            return 'inside';
                                        if (prev === 'inside')
                                            return 'slanted';
                                        return 'top';
                                    });
                                }, title: "Posizione valori sulle barre: Sopra / Dentro / Di traverso (clicca per alternare)", children: ["\uD83C\uDFF7\uFE0F ", valuePosition === 'inside' ? 'Valori: Dentro' : valuePosition === 'slanted' ? 'Valori: Di traverso' : 'Valori: Sopra'] })] }), _jsxs("div", { className: "stratum-bar-toolbar-right", children: [viewMode === '3d' && (_jsxs(_Fragment, { children: [_jsx("button", { ref: btn3DRef, type: "button", className: `stratum-bar-btn ${showSettings3D ? 'active' : ''}`, onClick: handleToggle3D, title: "Parametri 3D (Inclinazione & Profondit\u00E0)", children: "\u2699\uFE0F 3D" }), showSettings3D && popoverPos && createPortal(_jsxs("div", { ref: popoverRef, className: "stratum-bar-popover stratum-bar-popover-portal", style: {
                                            position: 'fixed',
                                            top: popoverPos.top - window.scrollY,
                                            left: popoverPos.left,
                                            transform: 'translateX(-100%)',
                                        }, children: [_jsxs("div", { className: "stratum-bar-popover-row", children: [_jsx("span", { children: "Inclinazione" }), _jsx("input", { type: "range", min: "10", max: "60", value: tilt3D, className: "stratum-bar-slider", onChange: e => setTilt3D(Number(e.target.value)) }), _jsxs("span", { className: "stratum-bar-val", children: [tilt3D, "\u00B0"] })] }), _jsxs("div", { className: "stratum-bar-popover-row", children: [_jsx("span", { children: "Profondit\u00E0" }), _jsx("input", { type: "range", min: "8", max: "45", value: depth3D, className: "stratum-bar-slider", onChange: e => setDepth3D(Number(e.target.value)) }), _jsxs("span", { className: "stratum-bar-val", children: [depth3D, "px"] })] }), _jsxs("div", { className: "stratum-bar-popover-row", style: { marginTop: 4 }, children: [_jsx("span", { children: "Geometria" }), _jsxs("div", { className: "stratum-bar-segmented", children: [_jsx("button", { type: "button", className: `stratum-bar-btn ${barShape3D === 'prism' ? 'active' : ''}`, onClick: () => setBarShape3D('prism'), style: { padding: '2px 8px', fontSize: 11 }, children: "Prisma" }), _jsx("button", { type: "button", className: `stratum-bar-btn ${barShape3D === 'cylinder' ? 'active' : ''}`, onClick: () => setBarShape3D('cylinder'), style: { padding: '2px 8px', fontSize: 11 }, children: "Cilindro" })] })] }), _jsxs("div", { className: "stratum-bar-popover-row", style: { marginTop: 4 }, children: [_jsx("span", { children: "Valori" }), _jsxs("div", { className: "stratum-bar-segmented", children: [_jsx("button", { type: "button", className: `stratum-bar-btn ${valuePosition === 'top' || valuePosition === 'outside' ? 'active' : ''}`, onClick: () => setValuePosition('top'), style: { padding: '2px 6px', fontSize: 10 }, children: "Sopra" }), _jsx("button", { type: "button", className: `stratum-bar-btn ${valuePosition === 'inside' ? 'active' : ''}`, onClick: () => setValuePosition('inside'), style: { padding: '2px 6px', fontSize: 10 }, children: "Dentro" }), _jsx("button", { type: "button", className: `stratum-bar-btn ${valuePosition === 'slanted' ? 'active' : ''}`, onClick: () => setValuePosition('slanted'), style: { padding: '2px 6px', fontSize: 10 }, children: "Di traverso" })] })] })] }), document.body)] })), toolbarConfig?.showExport !== false && (_jsxs("div", { className: "stratum-bar-segmented", children: [_jsx("button", { type: "button", className: "stratum-bar-btn stratum-bar-icon-btn", onClick: handleExportPNG, title: "Esporta immagine PNG ad alta risoluzione", children: "\uD83D\uDCF7" }), _jsx("button", { type: "button", className: "stratum-bar-btn stratum-bar-icon-btn", onClick: handleExportCSV, title: "Esporta dati in formato CSV", children: "\uD83D\uDCCA" })] }))] })] })), _jsx("div", { className: "stratum-bar-canvas-container", ref: chartContainerRef })] }));
};
export default StratumBarChart;
//# sourceMappingURL=StratumBarChart.js.map