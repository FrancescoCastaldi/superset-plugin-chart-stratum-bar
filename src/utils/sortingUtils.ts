/**
 * sortingUtils.ts — Natural & Chronological Category Sorting Engine
 * Handles time slots (e.g. 8–13, 13–18, 18–22, 22–8), days of the week,
 * month names, numbered categories (1 - Lunedì), and natural numeric collation.
 */

export const KNOWN_TIME_SLOTS: Record<string, number> = {
  // Morning / Mattina
  '8-13': 10,
  '8–13': 10,
  '08-13': 10,
  '08–13': 10,
  // Afternoon / Pomeriggio
  '13-18': 20,
  '13–18': 20,
  // Evening / Sera
  '18-22': 30,
  '18–22': 30,
  // Night / Notte
  '22-8': 40,
  '22–8': 40,
  '22-08': 40,
  '22–08': 40,
  '22-24': 38,
  '22–24': 38,
  // Early morning / Overnight
  '0-8': 45,
  '0–8': 45,
  '00-08': 45,
  '00–08': 45,
};

export const KNOWN_DAYS: Record<string, number> = {
  'lun': 1,
  'lunedì': 1,
  'lunedi': 1,
  'mon': 1,
  'monday': 1,
  'mar': 2,
  'martedì': 2,
  'martedi': 2,
  'tue': 2,
  'tuesday': 2,
  'mer': 3,
  'mercoledì': 3,
  'mercoledi': 3,
  'wed': 3,
  'wednesday': 3,
  'gio': 4,
  'giovedì': 4,
  'giovedi': 4,
  'thu': 4,
  'thursday': 4,
  'ven': 5,
  'venerdì': 5,
  'venerdi': 5,
  'fri': 5,
  'friday': 5,
  'sab': 6,
  'sabato': 6,
  'sat': 6,
  'saturday': 6,
  'dom': 7,
  'domenica': 7,
  'sun': 7,
  'sunday': 7,
};

export const KNOWN_MONTHS: Record<string, number> = {
  'gen': 1,
  'gennaio': 1,
  'jan': 1,
  'january': 1,
  'feb': 2,
  'febbraio': 2,
  'february': 2,
  'mar': 3,
  'marzo': 3,
  'march': 3,
  'apr': 4,
  'aprile': 4,
  'april': 4,
  'mag': 5,
  'maggio': 5,
  'may': 5,
  'giu': 6,
  'giugno': 6,
  'june': 6,
  'lug': 7,
  'luglio': 7,
  'july': 7,
  'ago': 8,
  'agosto': 8,
  'aug': 8,
  'august': 8,
  'set': 9,
  'settembre': 9,
  'sep': 9,
  'september': 9,
  'ott': 10,
  'ottobre': 10,
  'oct': 10,
  'october': 10,
  'nov': 11,
  'novembre': 11,
  'november': 11,
  'dic': 12,
  'dicembre': 12,
  'dec': 12,
  'december': 12,
};

/**
 * Extracts a chronological sort rank for a category label.
 * Returns null if no custom chronological ranking applies.
 */
export function getCategoryRank(category: string): number | null {
  if (!category) return null;
  const primaryPart = category.includes(' · ') ? category.split(' · ')[0].trim() : category.trim();
  const clean = primaryPart.toLowerCase();

  // 1. Direct match on known time slots (including en-dash and hyphen)
  if (clean in KNOWN_TIME_SLOTS) {
    return KNOWN_TIME_SLOTS[clean];
  }

  // 2. Generic time slot pattern: e.g. "8-13", "08–14", "14:00 - 18:00"
  const timeSlotMatch = clean.match(/^(\d{1,2})(?::\d{2})?[\s\-–—/]+(\d{1,2})(?::\d{2})?$/);
  if (timeSlotMatch) {
    const startHour = parseInt(timeSlotMatch[1], 10);
    // Hospital / business day: 6..23 daytime/evening, 0..5 overnight after 23
    return startHour >= 6 ? startHour : startHour + 24;
  }

  // 3. Known days of the week (Italian & English)
  if (clean in KNOWN_DAYS) {
    return KNOWN_DAYS[clean];
  }

  // 4. Known month names (Italian & English)
  if (clean in KNOWN_MONTHS) {
    return KNOWN_MONTHS[clean];
  }

  // 5. Explicit numeric prefix like "1 - Lunedì", "02 - Febbraio", "1. Ambulatorio"
  const matchNumPrefix = clean.match(/^(\d{1,2})[\s\-:.)]\s*[A-Za-z]/);
  if (matchNumPrefix) {
    return parseInt(matchNumPrefix[1], 10);
  }

  return null;
}

/**
 * Sorts category dimension values chronologically, naturally, or alphabetically.
 * Preserves exact mapping between categories and series data points.
 */
export function sortCategories(categories: string[], orderDesc: boolean = false): string[] {
  const sorted = [...categories].sort((a, b) => {
    const rankA = getCategoryRank(a);
    const rankB = getCategoryRank(b);

    if (rankA !== null && rankB !== null && rankA !== rankB) {
      return rankA - rankB;
    }

    // Natural alphanumeric collation (e.g. "8-13" < "13-18", "2" < "10", ISO dates "2025-09" < "2025-10")
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });

  return orderDesc ? sorted.reverse() : sorted;
}
