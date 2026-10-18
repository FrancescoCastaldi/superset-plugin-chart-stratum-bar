export function adjustColorBrightness(hex: string, percent: number): string {
  if (!hex || !hex.startsWith('#')) return hex;
  let num = parseInt(hex.replace('#', ''), 16);
  if (isNaN(num)) return hex;
  let r = (num >> 16) + Math.round(255 * (percent / 100));
  let g = ((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100));
  let b = (num & 0x0000ff) + Math.round(255 * (percent / 100));
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function hexToRgba(hex: string, alpha: number): string {
  if (!hex || !hex.startsWith('#')) return `rgba(234, 88, 12, ${alpha})`;
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const DEFAULT_COLORS = [
  '#3b82f6', // Sapphire Blue
  '#10b981', // Emerald Green
  '#f59e0b', // Amber Orange
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#6366f1', // Indigo
];

export const EXECUTIVE_PALETTE = [
  '#0284c7', // Sky Blue
  '#0d9488', // Teal
  '#6366f1', // Indigo
  '#f59e0b', // Amber
  '#ec4899', // Rose Pink
  '#8b5cf6', // Purple
  '#10b981', // Emerald
  '#f97316', // Orange
];

export const HEALTHCARE_PALETTE = [
  '#0284c7', // Primary IRCCS Sky
  '#10b981', // Emerald Health
  '#8b5cf6', // Amethyst Care
  '#f59e0b', // Clinical Amber
  '#06b6d4', // Medical Cyan
  '#ec4899', // Diagnostics Rose
];

export const SLATE_DARK_PALETTE = [
  '#38bdf8', // Light Sky
  '#34d399', // Mint Emerald
  '#a78bfa', // Lavender Violet
  '#fbbf24', // Sun Amber
  '#f472b6', // Coral Pink
  '#22d3ee', // Electric Cyan
];

