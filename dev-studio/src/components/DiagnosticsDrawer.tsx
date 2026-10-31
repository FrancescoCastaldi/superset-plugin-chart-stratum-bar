import React, { useState } from 'react';

export interface LogEntry {
  id: string;
  time: string;
  type: 'perf' | 'filter' | 'config' | 'error';
  message: string;
  payload?: any;
}

interface DiagnosticsDrawerProps {
  logs: LogEntry[];
  pipelineTimeMs: number;
  seriesCount: number;
  onClearLogs: () => void;
}

export const DiagnosticsDrawer: React.FC<DiagnosticsDrawerProps> = ({
  logs,
  pipelineTimeMs,
  seriesCount,
  onClearLogs,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <footer className={`diagnostics-drawer ${isMinimized ? 'minimized' : ''}`}>
      <div className="drawer-header">
        <div className="drawer-header-left">
          <span className="drawer-title">⚡ LIVE DIAGNOSTICS &amp; EVENT MONITOR</span>
          <span className="metric-pill pill-perf">
            PIPELINE: {pipelineTimeMs.toFixed(1)} MS
          </span>
          <span className="metric-pill pill-nodes">
            SERIE: {seriesCount}
          </span>
        </div>
        <div className="drawer-header-right">
          <button type="button" className="btn-drawer" onClick={onClearLogs} title="Pulisci log">
            Pulisci Log
          </button>
          <button
            type="button"
            className="btn-drawer btn-minimize"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand drawer' : 'Collapse to icon'}
          >
            {isMinimized ? 'Maximize ▲' : 'Collapse to icon ▼'}
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="drawer-content">
          {logs.length === 0 ? (
            <div className="empty-logs">Nessun evento registrato. Interagisci con il grafico o modifica i controlli.</div>
          ) : (
            <div className="logs-list">
              {logs.map((log) => (
                <div key={log.id} className={`log-row log-${log.type}`}>
                  <span className="log-time">[{log.time}]</span>
                  <span className="log-type-tag">{log.type.toUpperCase()}</span>
                  <span className="log-msg">{log.message}</span>
                  {log.payload !== undefined && (
                    <span className="log-payload">{JSON.stringify(log.payload)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </footer>
  );
};
