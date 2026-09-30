import { sortCategories, getCategoryRank } from '../src/utils/sortingUtils';

describe('sortingUtils', () => {
  describe('getCategoryRank', () => {
    it('ranks known time slots correctly', () => {
      expect(getCategoryRank('8–13')).toBe(10);
      expect(getCategoryRank('8-13')).toBe(10);
      expect(getCategoryRank('13–18')).toBe(20);
      expect(getCategoryRank('18–22')).toBe(30);
      expect(getCategoryRank('22–8')).toBe(40);
    });

    it('ranks combined breakdown categories based on the primary dimension', () => {
      expect(getCategoryRank('8–13 · Call center')).toBe(10);
      expect(getCategoryRank('13–18 · App')).toBe(20);
      expect(getCategoryRank('22–8 · Web')).toBe(40);
    });

    it('ranks days of week and month names', () => {
      expect(getCategoryRank('Lunedì')).toBe(1);
      expect(getCategoryRank('Domenica')).toBe(7);
      expect(getCategoryRank('Gennaio')).toBe(1);
      expect(getCategoryRank('Dicembre')).toBe(12);
    });

    it('ranks numbered prefixes', () => {
      expect(getCategoryRank('1 - Lunedì')).toBe(1);
      expect(getCategoryRank('7 - Domenica')).toBe(7);
    });
  });

  describe('sortCategories', () => {
    it('sorts IDI time slots in chronological order (Mattina -> Notte)', () => {
      const slots = ['13–18', '22–8', '8–13', '18–22'];
      const sorted = sortCategories(slots, false);
      expect(sorted).toEqual(['8–13', '13–18', '18–22', '22–8']);
    });

    it('inverts time slots when orderDesc is true', () => {
      const slots = ['13–18', '22–8', '8–13', '18–22'];
      const sorted = sortCategories(slots, true);
      expect(sorted).toEqual(['22–8', '18–22', '13–18', '8–13']);
    });

    it('sorts numbered days correctly', () => {
      const days = ['7 - Domenica', '1 - Lunedì', '2 - Martedì'];
      expect(sortCategories(days, false)).toEqual(['1 - Lunedì', '2 - Martedì', '7 - Domenica']);
    });

    it('sorts ISO date strings naturally', () => {
      const dates = ['2026-09', '2025-10', '2025-09'];
      expect(sortCategories(dates, false)).toEqual(['2025-09', '2025-10', '2026-09']);
    });

    it('sorts combined categories chronologically', () => {
      const combined = ['13–18 · Call center', '8–13 · App', '22–8 · Web'];
      expect(sortCategories(combined, false)).toEqual([
        '8–13 · App',
        '13–18 · Call center',
        '22–8 · Web',
      ]);
    });
  });
});
