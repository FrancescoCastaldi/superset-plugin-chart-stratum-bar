import React from 'react';
import { ControlAccordion } from './ControlAccordion';

interface ExploreControlPanelProps {
  formData: Record<string, any>;
  onFormChange: (key: string, value: any) => void;
  availableColumns: string[];
  availableMetrics: string[];
}

export const ExploreControlPanel: React.FC<ExploreControlPanelProps> = ({
  formData,
  onFormChange,
  availableColumns,
  availableMetrics,
}) => {
  return (
    <aside className="explore-control-panel">
      <div className="control-panel-header">
        <span className="panel-title">SUPERSET EXPLORE CONTROLS</span>
        <span className="version-badge">STRATUMBAR v0.4.0</span>
      </div>

      <div className="control-panel-scroll">
        {/* SECTION 1: DATA & QUERY */}
        <ControlAccordion title="Data & Dimensions" icon="🗂️" defaultOpen={true}>
          <div className="control-group">
            <label className="control-label">X-Axis / Categoria Principale</label>
            <select
              className="control-select"
              value={Array.isArray(formData.x_axis) ? formData.x_axis[0] : formData.x_axis || ''}
              onChange={(e) => onFormChange('x_axis', e.target.value)}
            >
              {availableColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">Series / breakdown by color</label>
            <select
              className="control-select"
              value={Array.isArray(formData.groupby) && formData.groupby.length > 0 ? formData.groupby[0] : ''}
              onChange={(e) => onFormChange('groupby', e.target.value ? [e.target.value] : [])}
            >
              <option value="">(Nessun breakdown - serie unica)</option>
              {availableColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">Metrica Principale</label>
            <select
              className="control-select"
              value={Array.isArray(formData.metrics) ? formData.metrics[0] : formData.metrics || ''}
              onChange={(e) => onFormChange('metrics', [e.target.value])}
            >
              {availableMetrics.map((met) => (
                <option key={met} value={met}>
                  {met}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">Metrica Secondaria (Linea)</label>
            <select
              className="control-select"
              value={
                Array.isArray(formData.secondary_metrics) && formData.secondary_metrics.length > 0
                  ? formData.secondary_metrics[0]
                  : ''
              }
              onChange={(e) => onFormChange('secondary_metrics', e.target.value ? [e.target.value] : [])}
            >
              <option value="">(Nessuna metrica secondaria)</option>
              {availableMetrics.map((met) => (
                <option key={met} value={met}>
                  {met}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">Ordinamento (Sort By)</label>
            <select
              className="control-select"
              value={formData.sort_by || 'original'}
              onChange={(e) => onFormChange('sort_by', e.target.value)}
            >
              <option value="original">Originale (Ordine Query)</option>
              <option value="category">Alfabetico Categoria</option>
              <option value="metric">Valore Metrica</option>
            </select>
          </div>

          <div className="control-group-inline">
            <label className="control-checkbox-label">
              <input
                type="checkbox"
                checked={Boolean(formData.order_desc)}
                onChange={(e) => onFormChange('order_desc', e.target.checked)}
              />
              <span>Ordine Decrescente (DESC)</span>
            </label>
          </div>
        </ControlAccordion>

        {/* SECTION 2: 3D ISOMETRIC & VISUAL STYLE */}
        <ControlAccordion title="Visual Style & 3D Isometric" icon="🧊" defaultOpen={true}>
          <div className="control-group">
            <label className="control-label">Palette Colori Executive</label>
            <select
              className="control-select"
              value={formData.color_scheme || 'executive'}
              onChange={(e) => onFormChange('color_scheme', e.target.value)}
            >
              <option value="executive">Executive Sapphire &amp; Slate (Consigliata)</option>
              <option value="healthcare">Healthcare &amp; Clinical IRCCS</option>
              <option value="slateDark">Dark Slate Cyber</option>
              <option value="supersetColors">Classica Superset</option>
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">Modalità di Rendering</label>
            <div className="segmented-control">
              <button
                type="button"
                className={`segmented-btn ${formData.viewMode === '3d' ? 'active' : ''}`}
                onClick={() => onFormChange('viewMode', '3d')}
              >
                🧊 3D Isometric
              </button>
              <button
                type="button"
                className={`segmented-btn ${formData.viewMode === '2d' ? 'active' : ''}`}
                onClick={() => onFormChange('viewMode', '2d')}
              >
                📊 2D Standard
              </button>
            </div>
          </div>

          <div className="control-group">
            <label className="control-label">Orientamento</label>
            <div className="segmented-control">
              <button
                type="button"
                className={`segmented-btn ${formData.orientation === 'vertical' ? 'active' : ''}`}
                onClick={() => onFormChange('orientation', 'vertical')}
              >
                Verticale (Colonne)
              </button>
              <button
                type="button"
                className={`segmented-btn ${formData.orientation === 'horizontal' ? 'active' : ''}`}
                onClick={() => onFormChange('orientation', 'horizontal')}
              >
                Orizzontale (Barre)
              </button>
            </div>
          </div>

          <div className="control-group">
            <label className="control-label">Impilamento (Stacking)</label>
            <div className="segmented-control">
              <button
                type="button"
                className={`segmented-btn ${formData.stacking === 'none' ? 'active' : ''}`}
                onClick={() => onFormChange('stacking', 'none')}
              >
                Raggruppate
              </button>
              <button
                type="button"
                className={`segmented-btn ${formData.stacking === 'stack' ? 'active' : ''}`}
                onClick={() => onFormChange('stacking', 'stack')}
              >
                Impilate
              </button>
              <button
                type="button"
                className={`segmented-btn ${formData.stacking === 'expand' ? 'active' : ''}`}
                onClick={() => onFormChange('stacking', 'expand')}
              >
                100% Espanso
              </button>
            </div>
          </div>

          {formData.viewMode === '3d' && (
            <>
              <div className="control-group">
                <label className="control-label">Forma Geometrica 3D</label>
                <div className="segmented-control">
                  <button
                    type="button"
                    className={`segmented-btn ${formData.barShape3D === 'prism' ? 'active' : ''}`}
                    onClick={() => onFormChange('barShape3D', 'prism')}
                  >
                    Prisma Rettangolare
                  </button>
                  <button
                    type="button"
                    className={`segmented-btn ${formData.barShape3D === 'cylinder' ? 'active' : ''}`}
                    onClick={() => onFormChange('barShape3D', 'cylinder')}
                  >
                    Colonna Cilindrica
                  </button>
                </div>
              </div>

              <div className="control-group">
                <div className="control-label-split">
                  <span>Profondità Isometrica</span>
                  <span className="control-badge">{formData.depth3D ?? 20} px</span>
                </div>
                <input
                  type="range"
                  className="control-range"
                  min="10"
                  max="50"
                  step="2"
                  value={formData.depth3D ?? 20}
                  onChange={(e) => onFormChange('depth3D', Number(e.target.value))}
                />
              </div>

              <div className="control-group">
                <div className="control-label-split">
                  <span>Inclinazione (Tilt)</span>
                  <span className="control-badge">{formData.tilt3D ?? 25}°</span>
                </div>
                <input
                  type="range"
                  className="control-range"
                  min="10"
                  max="45"
                  step="1"
                  value={formData.tilt3D ?? 25}
                  onChange={(e) => onFormChange('tilt3D', Number(e.target.value))}
                />
              </div>

              <div className="control-group-inline">
                <label className="control-checkbox-label">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.shadow3D ?? true)}
                    onChange={(e) => onFormChange('shadow3D', e.target.checked)}
                  />
                  <span>Ombreggiatura e Riflessi Sfaccettati 3D</span>
                </label>
              </div>
            </>
          )}

          {formData.viewMode === '2d' && (
            <div className="control-group">
              <div className="control-label-split">
                <span>Raggio Angoli Barre (Border Radius)</span>
                <span className="control-badge">{formData.barBorderRadius ?? 4} px</span>
              </div>
              <input
                type="range"
                className="control-range"
                min="0"
                max="16"
                step="1"
                value={formData.barBorderRadius ?? 4}
                onChange={(e) => onFormChange('barBorderRadius', Number(e.target.value))}
              />
            </div>
          )}
        </ControlAccordion>

        {/* SECTION 3: BENCHMARK, AXIS BREAK & ANNOTATIONS */}
        <ControlAccordion title="Benchmark & Analysis" icon="🎯" defaultOpen={true}>
          <div className="control-group-inline">
            <label className="control-checkbox-label">
              <input
                type="checkbox"
                checked={Boolean(formData.showBenchmark)}
                onChange={(e) => onFormChange('showBenchmark', e.target.checked)}
              />
              <span>Mostra Linea Benchmark Obiettivo</span>
            </label>
          </div>

          {formData.showBenchmark && (
            <>
              <div className="control-group">
                <label className="control-label">Tipo di Benchmark</label>
                <select
                  className="control-select"
                  value={formData.benchmarkType || 'fixed_value'}
                  onChange={(e) => onFormChange('benchmarkType', e.target.value)}
                >
                  <option value="fixed_value">Valore Fisso Target</option>
                  <option value="average">Media Dinamica Dataset</option>
                  <option value="median">Mediana Dinamica</option>
                </select>
              </div>

              {formData.benchmarkType === 'fixed_value' && (
                <div className="control-group">
                  <label className="control-label">Valore Benchmark</label>
                  <input
                    type="number"
                    className="control-input"
                    value={formData.benchmarkValue ?? 100}
                    onChange={(e) => onFormChange('benchmarkValue', Number(e.target.value))}
                  />
                </div>
              )}

              <div className="control-group-inline">
                <label className="control-checkbox-label">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.showDeltaBadge ?? true)}
                    onChange={(e) => onFormChange('showDeltaBadge', e.target.checked)}
                  />
                  <span>Mostra Badge Delta % vs Benchmark</span>
                </label>
              </div>

              <div className="control-group">
                <label className="control-label">Polarità del Delta</label>
                <select
                  className="control-select"
                  value={formData.deltaPolarity || 'normal'}
                  onChange={(e) => onFormChange('deltaPolarity', e.target.value)}
                >
                  <option value="normal">Normale (Verde se maggiore del target)</option>
                  <option value="inverted">Invertita (Verde se minore, es. Costi/Attesa)</option>
                </select>
              </div>
            </>
          )}

          <div className="control-group-inline">
            <label className="control-checkbox-label">
              <input
                type="checkbox"
                checked={Boolean(formData.show_smart_annotations)}
                onChange={(e) => onFormChange('show_smart_annotations', e.target.checked)}
              />
              <span>Smart Annotations (Pin su Picchi &amp; Minimi)</span>
            </label>
          </div>

          <div className="control-group-inline">
            <label className="control-checkbox-label">
              <input
                type="checkbox"
                checked={Boolean(formData.enable_axis_break)}
                onChange={(e) => onFormChange('enable_axis_break', e.target.checked)}
              />
              <span>Abilita Axis Break per Outlier Estremi</span>
            </label>
          </div>

          {formData.enable_axis_break && (
            <div className="control-group">
              <label className="control-label">Soglia Taglio Asse (Threshold)</label>
              <input
                type="number"
                className="control-input"
                value={formData.axis_break_threshold ?? 2500}
                onChange={(e) => onFormChange('axis_break_threshold', Number(e.target.value))}
              />
            </div>
          )}
        </ControlAccordion>

        {/* SECTION 4: LABELS, LEGEND & AXES */}
        <ControlAccordion title="Labels, Legend & Axes" icon="🏷️" defaultOpen={false}>
          <div className="control-group-inline">
            <label className="control-checkbox-label">
              <input
                type="checkbox"
                checked={Boolean(formData.showValue ?? true)}
                onChange={(e) => onFormChange('showValue', e.target.checked)}
              />
              <span>Mostra Etichette Valore sulle Barre</span>
            </label>
          </div>

          {formData.showValue && (
            <div className="control-group">
              <label className="control-label">Posizione Etichetta Valore</label>
              <select
                className="control-select"
                value={formData.valuePosition || 'top'}
                onChange={(e) => onFormChange('valuePosition', e.target.value)}
              >
                <option value="top">In Cima alla Barra (Top)</option>
                <option value="inside">All interno della Barra</option>
                <option value="outside">Esterna</option>
                <option value="slanted">Inclinata</option>
              </select>
            </div>
          )}

          <div className="control-group">
            <label className="control-label">Formato Numerico</label>
            <select
              className="control-select"
              value={formData.numberFormat || ',.0f'}
              onChange={(e) => onFormChange('numberFormat', e.target.value)}
            >
              <option value=",.0f">Intero con separatore migliaia (1.234)</option>
              <option value=",.1f">1 Decimale (1.234,5)</option>
              <option value=",.2f">2 Decimali (1.234,56)</option>
              <option value="$,.0f">Valuta Euro (€ 1.234)</option>
              <option value=".1%">Percentuale (.1%)</option>
            </select>
          </div>

          <div className="control-group-inline">
            <label className="control-checkbox-label">
              <input
                type="checkbox"
                checked={Boolean(formData.show_legend ?? true)}
                onChange={(e) => onFormChange('show_legend', e.target.checked)}
              />
              <span>Mostra Legenda Serie</span>
            </label>
          </div>

          <div className="control-group">
            <label className="control-label">Titolo Asse X</label>
            <input
              type="text"
              className="control-input"
              value={formData.x_axis_title || ''}
              onChange={(e) => onFormChange('x_axis_title', e.target.value)}
              placeholder="Es. Canale di Prenotazione"
            />
          </div>

          <div className="control-group">
            <label className="control-label">Titolo Asse Y Principale</label>
            <input
              type="text"
              className="control-input"
              value={formData.y_axis_title || ''}
              onChange={(e) => onFormChange('y_axis_title', e.target.value)}
              placeholder="Es. Volume Prestazioni"
            />
          </div>

          <div className="control-group">
            <label className="control-label">Titolo Asse Y Secondario</label>
            <input
              type="text"
              className="control-input"
              value={formData.y_axis_2_title || ''}
              onChange={(e) => onFormChange('y_axis_2_title', e.target.value)}
              placeholder="Es. Tempo Medio di Attesa (gg)"
            />
          </div>
        </ControlAccordion>
      </div>
    </aside>
  );
};
