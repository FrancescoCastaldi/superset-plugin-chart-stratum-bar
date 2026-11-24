import type { ControlPanelSectionConfig } from '@superset-ui/chart-controls';
import { isOn } from './helpers';

const toolbar: ControlPanelSectionConfig = {
  label: 'Barra degli strumenti (in dashboard)',
  tabOverride: 'customize',
  description:
    'La barra piccola sopra il grafico, visibile a chi guarda la dashboard. Ogni pulsante può essere nascosto. Il grafico resta uguale, cambia solo ciò che l\'utente può modificare al volo.',
  expanded: false,
  controlSetRows: [
    [
      {
        name: 'enableToolbar',
        config: {
          type: 'CheckboxControl',
          label: 'Mostra la barra degli strumenti',
          description: 'Attiva la barra con i pulsanti qui sotto. Disattivala per un grafico senza pulsanti.',
          default: true,
          renderTrigger: true,
        },
      },
    ],
    [
      {
        name: 'toolbar_show_view_mode',
        config: {
          type: 'CheckboxControl',
          label: 'Pulsante 2D / 3D',
          description: 'Permette di passare da visualizzazione 3D a 2D mentre si guarda la dashboard.',
          default: true,
          renderTrigger: true,
          visibility: isOn('enableToolbar'),
        },
      },
      {
        name: 'toolbar_show_orientation',
        config: {
          type: 'CheckboxControl',
          label: 'Pulsante direzione (↕ / ↔)',
          description: 'Permette di girare il grafico tra colonne verticali e barre orizzontali.',
          default: true,
          renderTrigger: true,
          visibility: isOn('enableToolbar'),
        },
      },
    ],
    [
      {
        name: 'toolbar_show_stacking',
        config: {
          type: 'CheckboxControl',
          label: 'Pulsante affiancate / impilate',
          description: 'Permette di passare tra serie affiancate e impilate.',
          default: true,
          renderTrigger: true,
          visibility: isOn('enableToolbar'),
        },
      },
      {
        name: 'toolbar_show_dual_axis',
        config: {
          type: 'CheckboxControl',
          label: 'Pulsante secondo asse',
          description: 'Permette di mostrare o nascondere il secondo asse.',
          default: true,
          renderTrigger: true,
          visibility: isOn('enableToolbar'),
        },
      },
    ],
    [
      {
        name: 'toolbar_show_breakdown_toggle',
        config: {
          type: 'CheckboxControl',
          label: 'Pulsante unisci asse e serie',
          description: 'Permette di unire o separare la suddivisione per serie nelle etichette dell\'asse X.',
          default: true,
          renderTrigger: true,
          visibility: isOn('enableToolbar'),
        },
      },
      {
        name: 'toolbar_show_benchmark',
        config: {
          type: 'CheckboxControl',
          label: 'Pulsante soglia (obiettivo)',
          description: 'Permette di mostrare o nascondere la linea di soglia.',
          default: true,
          renderTrigger: true,
          visibility: isOn('enableToolbar'),
        },
      },
    ],
    [
      {
        name: 'toolbar_show_axis_break',
        config: {
          type: 'CheckboxControl',
          label: 'Pulsante asse spezzato (✂️)',
          description: 'Permette di attivare o disattivare l\'asse spezzato mentre si guarda la dashboard.',
          default: true,
          renderTrigger: true,
          visibility: isOn('enableToolbar'),
        },
      },
      {
        name: 'toolbar_show_export',
        config: {
          type: 'CheckboxControl',
          label: 'Pulsanti di esportazione (PNG / CSV)',
          description: 'Scarica il grafico come immagine PNG o i dati aggregati come CSV.',
          default: true,
          renderTrigger: true,
          visibility: isOn('enableToolbar'),
        },
      },
    ],
  ],
};

export default toolbar;
