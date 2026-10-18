import React, { useState } from 'react';

interface EChartsOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  echartsOptions: any;
}

export const EChartsOptionsModal: React.FC<EChartsOptionsModalProps> = ({
  isOpen,
  onClose,
  echartsOptions,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const jsonStr = JSON.stringify(echartsOptions, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">⚡</span>
            <h3>ECharts Resolved Options JSON</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-subtitle">
            Questo oggetto rappresenta la configurazione finale passata al motore ECharts per generare la visualizzazione corrente (2D o 3D isometrica).
          </p>
          <pre className="options-json-preview">
            <code>{jsonStr}</code>
          </pre>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-modal btn-copy" onClick={handleCopy}>
            {copied ? '✓ Copiato!' : '📋 Copia JSON'}
          </button>
          <button type="button" className="btn-modal btn-close" onClick={onClose}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
