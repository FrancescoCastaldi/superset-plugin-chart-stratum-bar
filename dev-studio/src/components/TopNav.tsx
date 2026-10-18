import React from 'react';
import { ALL_SCENARIOS, ScenarioDefinition } from '../mockData';

interface TopNavProps {
  currentScenario: ScenarioDefinition;
  onSelectScenario: (id: string) => void;
  onResetPreset: () => void;
  onCopyConfig: () => void;
  onOpenEChartsModal: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentScenario,
  onSelectScenario,
  onResetPreset,
  onCopyConfig,
  onOpenEChartsModal,
}) => {
  return (
    <header className="studio-topnav">
      <div className="topnav-left">
        <div className="brand-badge">
          <span className="brand-icon">📊</span>
          <span className="brand-name">StratumBar Live Dev Studio</span>
          <span className="superset-version-tag">Apache Superset 6.1.0</span>
        </div>
      </div>

      <div className="topnav-center">
        <div className="scenario-selector-wrap">
          <label htmlFor="scenario-select" className="scenario-label">
            Scenario:
          </label>
          <select
            id="scenario-select"
            className="scenario-select"
            value={currentScenario.id}
            onChange={(e) => onSelectScenario(e.target.value)}
          >
            {ALL_SCENARIOS.map((scen) => (
              <option key={scen.id} value={scen.id}>
                {scen.name}
              </option>
            ))}
          </select>
          <span className="scenario-rows-count">{currentScenario.data.length} righe sorgente</span>
        </div>
      </div>

      <div className="topnav-right">
        <button
          type="button"
          className="btn-toolbar btn-reset-preset"
          onClick={onResetPreset}
          title="Ripristina i parametri originali del preset"
        >
          ↺ Reset Preset
        </button>
        <button
          type="button"
          className="btn-toolbar btn-copy-config"
          onClick={onCopyConfig}
          title="Copia formData JSON negli appunti"
        >
          📋 Copia Config
        </button>
        <button
          type="button"
          className="btn-toolbar btn-echarts-options"
          onClick={onOpenEChartsModal}
          title="Visualizza opzioni ECharts generate"
        >
          ⚡ ECharts Options
        </button>
      </div>
    </header>
  );
};
