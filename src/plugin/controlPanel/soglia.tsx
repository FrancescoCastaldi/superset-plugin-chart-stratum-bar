import type { ControlPanelSectionConfig } from '@superset-ui/chart-controls';
import { allOf, isOn, isValue } from './helpers';

const soglia: ControlPanelSectionConfig = {
  label: 'Soglia e annotazioni',
  tabOverride: 'customize',
  description:
    'Una linea di riferimento (obiettivo o media) per confrontare le barre, e l\'evidenziazione automatica di massimi e minimi.',
  expanded: true,
  controlSetRows: [
    [
      {
        name: 'show_smart_annotations',
        config: {
          type: 'CheckboxControl',
          label: 'Evidenzia massimo e minimo',
          description: 'Segnala automaticamente la barra più alta (🏆) e quella più bassa (📉) con la loro etichetta.',
          default: false,
          renderTrigger: true,
        },
      },
    ],
    [
      {
        name: 'showBenchmark',
        config: {
          type: 'CheckboxControl',
          label: 'Mostra la linea di soglia (obiettivo)',
          description: 'Disegna una linea orizzontale di riferimento, per vedere quali barre superano l\'obiettivo.',
          default: false,
          renderTrigger: true,
        },
      },
      {
        name: 'benchmarkType',
        config: {
          type: 'SelectControl',
          label: 'Come calcolare la soglia',
          description:
            'Valore fisso: un numero scritto a mano. Media o mediana: calcolate sulle barre.',
          choices: [
            ['fixed_value', 'Valore fisso'],
            ['average', 'Media delle barre'],
            ['median', 'Mediana delle barre'],
          ],
          default: 'fixed_value',
          renderTrigger: true,
          visibility: isOn('showBenchmark'),
        },
      },
    ],
    [
      {
        name: 'benchmarkValue',
        config: {
          type: 'TextControl',
          label: 'Valore dell\'obiettivo',
          description: 'Il numero della linea di soglia. Esempio: 100 per "almeno 100 richieste al mese". Con i campi Time il valore è in secondi: 600 vale 10:00.',
          default: 100,
          renderTrigger: true,
          visibility: allOf(isOn('showBenchmark'), isValue('benchmarkType', 'fixed_value')),
        },
      },
      {
        name: 'showDeltaBadge',
        config: {
          type: 'CheckboxControl',
          label: 'Mostra lo scostamento dalla soglia',
          description: 'Nel tooltip, la differenza in percentuale rispetto alla soglia. Esempio: "vs Target: +12,5%".',
          default: true,
          renderTrigger: true,
          visibility: isOn('showBenchmark'),
        },
      },
    ],
    [
      {
        name: 'deltaPolarity',
        config: {
          type: 'SelectControl',
          label: 'Colore dello scostamento dalla soglia',
          description:
            'Normale: sopra la soglia è verde. Invertito: sopra la soglia è rosso (es. tempi di attesa, costi).',
          choices: [
            ['normal', 'Normale (sopra soglia verde)'],
            ['inverted', 'Invertito (sopra soglia rosso)'],
          ],
          default: 'normal',
          renderTrigger: true,
          visibility: allOf(isOn('showBenchmark'), isOn('showDeltaBadge')),
        },
      },
    ],
  ],
};

export default soglia;
