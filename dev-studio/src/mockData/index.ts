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
    description: 'Original StratumBar reference: bookings by channel and regime, with a secondary waiting-time line.',
    data: idiHealthcareData,
    formData: idiHealthcareFormData,
  },
  {
    id: 'sales_benchmark',
    name: 'Sales Benchmark & Delta % (Stacked)',
    category: 'Commerciale & KPI',
    description: 'Stacked 3D cylindrical columns with a fixed benchmark, percentage delta badges and currency formatting.',
    data: salesBenchmarkData,
    formData: salesBenchmarkFormData,
  },
  {
    id: 'axis_break',
    name: 'Outlier & Axis Break Isometrico',
    category: 'Statistica & Distribuzioni',
    description: 'Automatic and manual handling of extreme peaks through an axis break and an isometric cut mark.',
    data: axisBreakOutlierData,
    formData: axisBreakOutlierFormData,
  },
];

export function getScenarioById(id: string): ScenarioDefinition {
  const found = ALL_SCENARIOS.find(s => s.id === id);
  return found || ALL_SCENARIOS[0];
}
