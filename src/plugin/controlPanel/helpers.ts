import type { ControlPanelsContainerProps } from '@superset-ui/chart-controls';

/** Condizione di visibilità di un controllo: legge i valori degli altri controlli del pannello. */
export type Visibility = (props: ControlPanelsContainerProps) => boolean;

/** Il controllo `name` è acceso (o ha un valore). */
export const isOn =
  (name: string): Visibility =>
  ({ controls }) =>
    Boolean(controls?.[name]?.value);

/** Il controllo `name` ha esattamente il valore `expected`. */
export const isValue =
  (name: string, expected: unknown): Visibility =>
  ({ controls }) =>
    controls?.[name]?.value === expected;

/** Tutte le condizioni vere insieme. */
export const allOf =
  (...conditions: Visibility[]): Visibility =>
  props =>
    conditions.every(condition => condition(props));

/** C'è un confronto tra due periodi (la modalità non è "nessuno"). */
export const isComparing: Visibility = ({ controls }) =>
  Boolean(controls?.time_comparison_mode?.value) && controls?.time_comparison_mode?.value !== 'none';

/** Ci sono metriche sul secondo asse. */
export const hasSecondary: Visibility = ({ controls }) =>
  Boolean(controls?.secondary_metrics?.value && (controls.secondary_metrics.value as any[]).length > 0);

/** Ci sono serie per colore (breakdown). */
export const hasGroupby: Visibility = ({ controls }) =>
  Boolean(controls?.groupby?.value && (controls.groupby.value as any[]).length > 0);
