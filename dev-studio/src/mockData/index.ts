import { idiHealthcareData, idiHealthcareFormData } from './idiHealthcareScenario';
import { salesBenchmarkData, salesBenchmarkFormData } from './salesBenchmarkScenario';
import { axisBreakOutlierData, axisBreakOutlierFormData } from './axisBreakOutlierScenario';

export interface ScenarioDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  data: any[];
  formData: Record<string, any>;
}

export const ALL_SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'healthcare',
    name: 'Sanita IDI IRCCS (Canale & Regime)',
    category: 'Healthcare ADS (Slice 430)',
    description: 'Riferimento originario di StratumBar: prenotazioni sanitarie per canale e regime SSN/Privato con linea secondaria di attesa.',
    data: idiHealthcareData,
    formData: idiHealthcareFormData,
  },
  {
    id: 'sales_benchmark',
    name: 'Sales Benchmark & Delta % (Stacked)',
    category: 'Commerciale & KPI',
    description: 'Colonne 3D cilindriche impilate con benchmark fisso, delta badge percentuali e formattazione valutaria.',
    data: salesBenchmarkData,
    formData: salesBenchmarkFormData,
  },
  {
    id: 'axis_break',
    name: 'Outlier & Axis Break Isometrico',
    category: 'Statistica & Distribuzioni',
    description: 'Gestione automatica e manuale di picchi estremi tramite spezzatura dell asse e cut-mark isometrico.',
    data: axisBreakOutlierData,
    formData: axisBreakOutlierFormData,
  },
];

export function getScenarioById(id: string): ScenarioDefinition {
  const found = ALL_SCENARIOS.find(s => s.id === id);
  return found || ALL_SCENARIOS[0];
}
