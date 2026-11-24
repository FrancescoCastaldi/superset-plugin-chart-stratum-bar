import { ControlPanelSectionConfig, sharedControls } from '@superset-ui/chart-controls';
import { allOf, isComparing, isOn, isValue } from './helpers';

const confronto: ControlPanelSectionConfig = {
  label: 'Confronto tra due periodi',
  tabOverride: 'data',
  description:
    'Mette accanto al periodo corrente (T1) un secondo periodo (T2), per vedere quanto è cambiato. Il periodo T1 segue sempre il filtro di tempo della dashboard, per esempio il Calendar Filter. Scegli la modalità in base a come vuoi scegliere il secondo periodo.',
  expanded: true,
  controlSetRows: [
    [
      {
        name: 'time_comparison_mode',
        config: {
          type: 'SelectControl',
          label: 'Modalità di confronto',
          description:
            'Seleziona come generare il secondo periodo (T2) accanto al periodo corrente (T1). "Filtro temporale dashboard": eredita il confronto impostato nel Calendar Filter nativo. "Confronto automatico": calcola automaticamente il T2 spostando indietro il T1 dell\'intervallo specificato. "Avanzato": confronta due metriche distinte del dataset. Le modalità temporali supportano confronti multi-metrica.',
          choices: [
            ['none', 'Nessun confronto (periodo singolo)'],
            ['time_offsets', 'Filtro temporale dashboard (Calendar Filter / T1 vs T2)'],
            ['time_shift', 'Confronto automatico (shift: 1 anno fa, 1 mese fa, ecc.)'],
            ['dual_metric', 'Avanzato: due metriche già calcolate'],
          ],
          default: 'none',
          renderTrigger: true,
        },
      },
    ],
    [
      {
        name: 'comparison_shift',
        config: {
          type: 'SelectControl',
          freeForm: true,
          label: 'Di quanto spostare il periodo',
          description:
            'Intervallo temporale di spostamento all\'indietro del periodo corrente (T1). Scegli una voce predefinita o digita un intervallo personalizzato in sintassi Superset. Esempi: "1 year ago" (anno precedente), "3 months ago" (trimestre precedente), "1 month ago" (mese precedente), "1 week ago" (settimana precedente).',
          choices: [
            ['1 year ago', 'Anno precedente (1 year ago)'],
            ['3 months ago', 'Trimestre precedente (3 months ago)'],
            ['1 month ago', 'Mese precedente (1 month ago)'],
            ['52 weeks ago', '52 settimane prima (52 weeks ago)'],
            ['28 days ago', '28 giorni prima (28 days ago)'],
            ['1 week ago', 'Settimana precedente (1 week ago)'],
          ],
          default: '1 year ago',
          renderTrigger: true,
          visibility: isValue('time_comparison_mode', 'time_shift'),
        },
      },
    ],
    [
      {
        name: 'comparison_metric',
        config: {
          ...sharedControls.metric,
          label: 'Metrica del secondo periodo (T2)',
          description:
            'Solo per la modalità avanzata: la metrica già calcolata del secondo periodo (T2) da confrontare con la prima metrica selezionata. Esempio: "Richieste 2025" a confronto con "Richieste 2026". Per confronti multi-metrica su base temporale, seleziona la modalità Calendar Filter o Confronto automatico.',
          clearable: true,
          validators: [],
          visibility: isValue('time_comparison_mode', 'dual_metric'),
        },
      },
    ],
    [
      {
        name: 'time1_label',
        config: {
          type: 'TextControl',
          label: 'Nome del periodo corrente (T1)',
          description:
            'Il nome che compare nella legenda e nel tooltip. Lascia vuoto per il nome automatico preso dal filtro. Esempi: "Ottobre 2026", "Anno corrente".',
          default: '',
          renderTrigger: true,
          visibility: isComparing,
        },
      },
      {
        name: 'time2_label',
        config: {
          type: 'TextControl',
          label: 'Nome del periodo di confronto (T2)',
          description:
            'Il nome del secondo periodo nella legenda e nel tooltip. Lascia vuoto per il nome automatico. Esempi: "Ottobre 2025", "Anno precedente".',
          default: '',
          renderTrigger: true,
          visibility: isComparing,
        },
      },
    ],
    [
      {
        name: 'show_comparison_delta',
        config: {
          type: 'CheckboxControl',
          label: 'Mostra lo scostamento tra T1 e T2',
          description:
            'Nel tooltip, sotto le due barre, compare la differenza in valore assoluto e in percentuale tra il periodo corrente e il confronto. Esempio: 120 contro 100 mostra "+20,0% (+20)". Con più metriche, lo scostamento è calcolato per ciascuna coppia.',
          default: true,
          renderTrigger: true,
          visibility: isComparing,
        },
      },
      {
        name: 'comparison_delta_polarity',
        config: {
          type: 'SelectControl',
          label: 'Colore dello scostamento',
          description:
            'Normale: l\'aumento è verde, il calo rosso (es. accessi, fatturato). Invertito: l\'aumento è rosso, il calo verde (es. tempi di attesa, costi).',
          choices: [
            ['normal', 'Normale (aumento verde, calo rosso)'],
            ['inverted', 'Invertito (aumento rosso, calo verde)'],
          ],
          default: 'normal',
          renderTrigger: true,
          visibility: allOf(isComparing, isOn('show_comparison_delta')),
        },
      },
    ],
  ],
};

export default confronto;
