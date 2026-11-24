import type { ControlPanelSectionConfig } from '@superset-ui/chart-controls';
import { isValue } from './helpers';

const aspetto: ControlPanelSectionConfig = {
  label: 'Aspetto e motore di disegno',
  tabOverride: 'customize',
  description:
    'Come appare il grafico: forma 3D o 2D, colori, tema e formato dei numeri.',
  expanded: true,
  controlSetRows: [
    [
      {
        name: 'viewMode',
        config: {
          type: 'SelectControl',
          label: 'Visualizzazione',
          description:
            '3D isometrico: barre a volume con ombre. 2D moderno: barre piatte con angoli arrotondati e, se attivo, lo sfondo di riferimento. Chi guarda può cambiarla anche in dashboard, se la barra degli strumenti è attiva.',
          choices: [
            ['3d', '3D isometrico (volume)'],
            ['2d', '2D moderno (piatto, angoli arrotondati)'],
          ],
          default: '3d',
          renderTrigger: true,
        },
      },
      {
        name: 'theme_mode',
        config: {
          type: 'SelectControl',
          label: 'Tema colori',
          description: 'Chiaro per le dashboard con sfondo bianco, scuro per quelle con sfondo scuro.',
          choices: [
            ['light', 'Chiaro (Light Enterprise)'],
            ['dark', 'Scuro (Dark Obsidian)'],
          ],
          default: 'light',
          renderTrigger: true,
        },
      },
    ],
    [
      {
        name: 'color_scheme',
        config: {
          type: 'ColorSchemeControl',
          label: 'Palette di colori',
          description:
            'Palette usata per le barre principali e per le serie. Se la dashboard ha già colori assegnati alle etichette, questi hanno la precedenza.',
          renderTrigger: true,
          default: 'supersetColors',
        },
      },
      {
        name: 'enable_a11y_decal',
        config: {
          type: 'CheckboxControl',
          label: 'Motivi per daltonici',
          description:
            'Aggiunge un motivo geometrico alle barre, così le serie si distinguono anche senza colore. Utile per chi ha difficoltà a distinguere i colori.',
          default: false,
          renderTrigger: true,
        },
      },
    ],
    [
      {
        name: 'barShape3D',
        config: {
          type: 'SelectControl',
          label: 'Forma delle barre 3D',
          description: 'Parallelepipedo: barre squadrate. Cilindro: barre tonde. Vale solo con visualizzazione 3D.',
          choices: [
            ['prism', 'Parallelepipedo'],
            ['cylinder', 'Cilindro'],
          ],
          default: 'prism',
          renderTrigger: true,
          visibility: isValue('viewMode', '3d'),
        },
      },
      {
        name: 'shadow3D',
        config: {
          type: 'CheckboxControl',
          label: 'Ombre sotto le barre 3D',
          description: 'Disegna un\'ombra morbida sotto ogni barra 3D, per dare profondità. Disattivala per un disegno più essenziale.',
          default: true,
          renderTrigger: true,
          visibility: isValue('viewMode', '3d'),
        },
      },
    ],
    [
      {
        name: 'depth3D',
        config: {
          type: 'SliderControl',
          label: 'Profondità 3D (px)',
          description: 'Quanto è profonda la barra 3D, in pixel. Valori bassi (5-10) per barre quasi piatte, alti (30-50) per un effetto molto marcato.',
          min: 5,
          max: 50,
          step: 1,
          default: 20,
          renderTrigger: true,
          visibility: isValue('viewMode', '3d'),
        },
      },
      {
        name: 'tilt3D',
        config: {
          type: 'SliderControl',
          label: 'Inclinazione 3D (gradi)',
          description: 'L\'angolo di vista delle facce superiori e laterali delle barre. Esempio: 25 gradi è l\'impostazione standard, 45 le rende più visibili dall\'alto.',
          min: 15,
          max: 60,
          step: 1,
          default: 25,
          renderTrigger: true,
          visibility: isValue('viewMode', '3d'),
        },
      },
    ],
  ],
};

export default aspetto;
