import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import transformProps from '../../src/plugin/transformProps';
import StratumBarChart from '../../src/components/StratumBarChart';
import '../../src/components/StratumBarChart.css';
import './studio.css';

import { ALL_SCENARIOS, getScenarioById } from './mockData';
import { TopNav } from './components/TopNav';
import { ExploreControlPanel } from './components/ExploreControlPanel';
import { DiagnosticsDrawer, LogEntry } from './components/DiagnosticsDrawer';
import { EChartsOptionsModal } from './components/EChartsOptionsModal';
import { get2DBarOption } from '../../src/components/renderers2D';
import { get3DBarOption } from '../../src/components/renderers3D';

export default function App() {
  const [currentScenarioId, setCurrentScenarioId] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get('scenario') || 'healthcare';
  });
  const scenario = useMemo(() => getScenarioById(currentScenarioId), [currentScenarioId]);

  const [formData, setFormData] = useState<Record<string, any>>(() => {
    return { ...scenario.formData };
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isEChartsModalOpen, setIsEChartsModalOpen] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });
  const [pipelineTimeMs, setPipelineTimeMs] = useState(0);

  const canvasViewportRef = useRef<HTMLDivElement>(null);

  // ResizeObserver on canvas container
  useEffect(() => {
    if (!canvasViewportRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 50 && height > 50) {
          setDimensions({
            width: Math.floor(width),
            height: Math.floor(height),
          });
        }
      }
    });
    observer.observe(canvasViewportRef.current);
    return () => observer.disconnect();
  }, []);

  // Update scenario
  const handleSelectScenario = useCallback((id: string) => {
    setCurrentScenarioId(id);
    const nextScenario = getScenarioById(id);
    setFormData({ ...nextScenario.formData });
    addLog('perf', `Scenario caricato: ${nextScenario.name}`, { rows: nextScenario.data.length });
  }, []);

  // Reset to default scenario form data
  const handleResetFormData = useCallback(() => {
    setFormData({ ...scenario.formData });
    addLog('perf', `FormData ripristinato allo scenario: ${scenario.name}`);
  }, [scenario]);

  // Copy configuration JSON
  const handleCopyConfig = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(formData, null, 2));
    addLog('perf', 'Configurazione formData copiata negli appunti!');
  }, [formData]);

  // Log an event
  const addLog = useCallback((type: LogEntry['type'], message: string, payload?: any) => {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      time: new Date().toLocaleTimeString('it-IT', { hour12: false }),
      type,
      message,
      payload,
    };
    setLogs((prev) => [entry, ...prev.slice(0, 49)]);
  }, []);

  // Update single formData field
  const handleFormChange = useCallback((key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    addLog('config', `Controllo modificato: ${key}`, value);
  }, [addLog]);

  // Available columns and metrics from active scenario data
  const availableColumns = useMemo(() => {
    if (!scenario.data || scenario.data.length === 0) return [];
    return Object.keys(scenario.data[0]);
  }, [scenario]);

  const availableMetrics = useMemo(() => {
    if (!scenario.data || scenario.data.length === 0) return [];
    return Object.keys(scenario.data[0]).filter((key) => {
      const val = scenario.data[0][key];
      return typeof val === 'number';
    });
  }, [scenario]);

  // Cross filter mock handler
  const handleSetDataMask = useCallback((mask: any) => {
    addLog('filter', 'Cross-Filter setDataMask emesso', mask);
  }, [addLog]);

  // Execute transformProps with performance timing
  const { transformedProps, echartsOptions } = useMemo(() => {
    const t0 = performance.now();

    const chartProps = {
      width: dimensions.width,
      height: dimensions.height,
      formData: { ...formData },
      queriesData: [{ data: scenario.data }],
      hooks: {
        setDataMask: handleSetDataMask,
        onAddFilter: (f: any) => addLog('filter', 'Filtro onAddFilter applicato', f),
      },
    };

    let props: any;
    let opts: any = null;

    try {
      props = transformProps(chartProps as any);
      opts = props.viewMode === '3d' ? get3DBarOption(props) : get2DBarOption(props);
    } catch (e: any) {
      console.error('[StratumBar Dev Studio] Errore in transformProps:', e);
      addLog('error', `Errore transformProps: ${e.message}`);
      props = null;
    }

    const t1 = performance.now();
    setPipelineTimeMs(t1 - t0);

    return { transformedProps: props, echartsOptions: opts };
  }, [dimensions, formData, scenario, handleSetDataMask, addLog]);

  return (
    <div className="studio-container">
      <TopNav
        currentScenario={scenario}
        onSelectScenario={handleSelectScenario}
        onResetPreset={handleResetFormData}
        onCopyConfig={handleCopyConfig}
        onOpenEChartsModal={() => setIsEChartsModalOpen(true)}
      />

      <div className="studio-body">
        <ExploreControlPanel
          formData={formData}
          onFormChange={handleFormChange}
          availableColumns={availableColumns}
          availableMetrics={availableMetrics}
        />

        <main className="studio-canvas-area">
          <div className="canvas-viewport" ref={canvasViewportRef}>
            <div className="chart-card">
              {transformedProps ? (
                <StratumBarChart {...transformedProps} />
              ) : (
                <div style={{ padding: 30, color: '#ef4444' }}>
                  Errore durante la trasformazione delle proprietà del grafico. Controlla il Diagnostics Drawer.
                </div>
              )}
            </div>
          </div>

          <DiagnosticsDrawer
            logs={logs}
            pipelineTimeMs={pipelineTimeMs}
            seriesCount={transformedProps?.series?.length ?? 0}
            onClearLogs={() => setLogs([])}
          />
        </main>
      </div>

      <EChartsOptionsModal
        isOpen={isEChartsModalOpen}
        onClose={() => setIsEChartsModalOpen(false)}
        echartsOptions={echartsOptions}
      />
    </div>
  );
}
