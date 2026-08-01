import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getStoredActivityListSearch,
  useActivityTablePreferences,
  type ActivityTablePreferences,
} from './useActivityTablePreferences';

const STORAGE_KEY = 'activityTablePreferences' as const;

const mockSetSearchParams = vi.fn();
let mockSearchParams: URLSearchParams;

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));

const sessionStorageGet = vi.fn();
const sessionStorageSet = vi.fn();

function makeMockStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => {
      const result = sessionStorageGet(key);
      return result !== undefined ? result : (store.get(key) ?? null);
    },
    setItem: (key: string, value: string) => {
      sessionStorageSet(key, value);
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: () => null,
    get length() {
      return store.size;
    },
  };
}

describe('useActivityTablePreferences', () => {
  const canSeeDeleted = true;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    Object.defineProperty(window, 'sessionStorage', {
      value: makeMockStorage(),
      writable: true,
    });
    sessionStorageGet.mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial preferences', () => {
    it('returns defaults when URL has no known params and storage is empty', () => {
      const { result } = renderHook(() =>
        useActivityTablePreferences(canSeeDeleted)
      );

      expect(result.current.preferences.sortKey).toBe('startDate');
      expect(result.current.preferences.sortDirection).toBe('asc');
      expect(result.current.preferences.showCompleted).toBe(false);
      expect(result.current.preferences.showDeleted).toBe(false);
      expect(result.current.preferences.pageSize).toBe(25);
      expect(result.current.preferences.searchKeyword).toBe('');
      expect(result.current.preferences.filterState).toEqual(
        expect.objectContaining({
          categoryIds: [],
          activityStatusIds: [],
          tagIds: [],
          dateConfirmedFilter: 'any',
          timeConfirmedFilter: 'any',
        })
      );
    });

    it('parses sort and dir from URL when present', () => {
      mockSearchParams = new URLSearchParams('sort=lastUpdated&dir=asc');

      const { result } = renderHook(() =>
        useActivityTablePreferences(canSeeDeleted)
      );

      expect(result.current.preferences.sortKey).toBe('lastUpdated');
      expect(result.current.preferences.sortDirection).toBe('asc');
    });

    it('falls back to default sort when URL sort is invalid', () => {
      mockSearchParams = new URLSearchParams('sort=invalidKey&dir=asc');

      const { result } = renderHook(() =>
        useActivityTablePreferences(canSeeDeleted)
      );

      expect(result.current.preferences.sortKey).toBe('startDate');
      expect(result.current.preferences.sortDirection).toBe('asc');
    });

    it('parses completed and deleted from URL', () => {
      mockSearchParams = new URLSearchParams(
        'sort=startDate&completed=true&deleted=true'
      );

      const { result } = renderHook(() =>
        useActivityTablePreferences(canSeeDeleted)
      );

      expect(result.current.preferences.showCompleted).toBe(true);
      expect(result.current.preferences.showDeleted).toBe(true);
    });

    it('parses pageSize from URL and clamps to valid range', () => {
      mockSearchParams = new URLSearchParams('sort=startDate&pageSize=25');

      const { result } = renderHook(() =>
        useActivityTablePreferences(canSeeDeleted)
      );

      expect(result.current.preferences.pageSize).toBe(25);
    });

    it('falls back to default pageSize when URL pageSize is invalid', () => {
      mockSearchParams = new URLSearchParams('sort=startDate&pageSize=999');

      const { result } = renderHook(() =>
        useActivityTablePreferences(canSeeDeleted)
      );

      expect(result.current.preferences.pageSize).toBe(25);
    });

    it('parses search from URL', () => {
      mockSearchParams = new URLSearchParams('sort=startDate&search=foo+bar');

      const { result } = renderHook(() =>
        useActivityTablePreferences(canSeeDeleted)
      );

      expect(result.current.preferences.searchKeyword).toBe('foo bar');
    });

    it('parses filter state from URL (date range, category, status, tag)', () => {
      mockSearchParams = new URLSearchParams(
        'sort=startDate&dateFrom=2025-01-01&dateTo=2025-01-31&category=1,2&status=1,2&tag=10,20'
      );

      const { result } = renderHook(() =>
        useActivityTablePreferences(canSeeDeleted)
      );

      const f = result.current.preferences.filterState;
      expect(f.dateRange.startDate).toBe('2025-01-01');
      expect(f.dateRange.endDate).toBe('2025-01-31');
      expect(f.categoryIds).toEqual([1, 2]);
      expect(f.activityStatusIds).toEqual([1, 2]);
      expect(f.tagIds).toEqual([10, 20]);
    });

    it('parses confirmed filters from URL', () => {
      mockSearchParams = new URLSearchParams(
        'sort=startDate&dateConfirmed=confirmed&timeConfirmed=not_confirmed'
      );

      const { result } = renderHook(() =>
        useActivityTablePreferences(canSeeDeleted)
      );

      expect(result.current.preferences.filterState.dateConfirmedFilter).toBe(
        'confirmed'
      );
      expect(result.current.preferences.filterState.timeConfirmedFilter).toBe(
        'not_confirmed'
      );
    });

    it('uses sessionStorage when URL has no known params', () => {
      const stored: ActivityTablePreferences = {
        sortKey: 'lastUpdated',
        sortDirection: 'asc',
        showCompleted: true,
        showDeleted: false,
        pageSize: 25,
        searchKeyword: 'stored search',
        filterState: {
          dateRange: {
            startDate: '2025-02-01',
            endDate: '2025-02-28',
            noStartDate: false,
            noEndDate: false,
          },
          categoryIds: [1],
          activityStatusIds: [1],
          pitchRequiredStatusNames: [],
          pitchDateFilter: { kind: 'any' },
          lookAheadStatusValues: [],
          lookAheadSectionValues: [],
          dateConfirmedFilter: 'any',
          timeConfirmedFilter: 'any',
          tagIds: [],
          leadTeamIds: [],
          leadTeamIds: [],
          commsContactLeadUserIds: [],
          eventPlannerLeadIds: [],
          translationRequiredStatusIds: [],
          translationLanguageIds: [],
        },
      };
      sessionStorageGet.mockImplementation((key: string) =>
        key === STORAGE_KEY ? JSON.stringify(stored) : null
      );

      const { result } = renderHook(() =>
        useActivityTablePreferences(canSeeDeleted)
      );

      expect(result.current.preferences.sortKey).toBe('lastUpdated');
      expect(result.current.preferences.sortDirection).toBe('asc');
      expect(result.current.preferences.pageSize).toBe(25);
      expect(result.current.preferences.searchKeyword).toBe('stored search');
      expect(result.current.preferences.filterState.dateRange.startDate).toBe(
        '2025-02-01'
      );
      expect(result.current.preferences.filterState.categoryIds).toEqual([1]);
    });

    it('ignores sessionStorage when URL has any known param', () => {
      const stored = {
        sortKey: 'lastUpdated',
        sortDirection: 'asc',
        showCompleted: true,
        showDeleted: false,
        pageSize: 25,
        searchKeyword: 'stored',
        filterState: {
          dateRange: {
            startDate: '',
            endDate: '',
            noStartDate: false,
            noEndDate: false,
          },
          categoryIds: [] as number[],
          activityStatusIds: [] as number[],
          pitchRequiredStatusNames: [] as string[],
          pitchDateFilter: { kind: 'any' as const },
          lookAheadStatusValues: [] as string[],
          lookAheadSectionValues: [] as string[],
          dateConfirmedFilter: 'any' as const,
          timeConfirmedFilter: 'any' as const,
          tagIds: [] as number[],
          leadTeamIds: [] as number[],
          commsContactLeadUserIds: [] as number[],
          eventPlannerLeadIds: [] as number[],
          translationRequiredStatusIds: [],
          translationLanguageIds: [],
        },
      };
      sessionStorageGet.mockImplementation((key: string) =>
        key === STORAGE_KEY ? JSON.stringify(stored) : null
      );
      mockSearchParams = new URLSearchParams('sort=startDate');

      const { result } = renderHook(() =>
        useActivityTablePreferences(canSeeDeleted)
      );

      expect(result.current.preferences.sortKey).toBe('startDate');
      expect(result.current.preferences.searchKeyword).toBe('');
    });

    it('forces showDeleted false when canSeeDeleted is false', () => {
      mockSearchParams = new URLSearchParams('sort=startDate&deleted=true');

      const { result } = renderHook(() => useActivityTablePreferences(false));

      expect(result.current.preferences.showDeleted).toBe(false);
    });
  });

  describe('setPreferences', () => {
    it('updates preferences and writes to sessionStorage', () => {
      const { result } = renderHook(() =>
        useActivityTablePreferences(canSeeDeleted)
      );

      act(() => {
        result.current.setPreferences({
          sortKey: 'lastUpdated',
          sortDirection: 'asc',
          pageSize: 50,
        });
      });

      expect(result.current.preferences.sortKey).toBe('lastUpdated');
      expect(result.current.preferences.sortDirection).toBe('asc');
      expect(result.current.preferences.pageSize).toBe(50);

      expect(sessionStorageSet).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.stringContaining('"sortKey":"lastUpdated"')
      );
    });

    it('syncs to URL immediately when non-search preference changes', () => {
      const { result } = renderHook(() =>
        useActivityTablePreferences(canSeeDeleted)
      );

      act(() => {
        result.current.setPreferences({ sortKey: 'activityId' });
      });

      expect(mockSetSearchParams).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'activityId' }),
        { replace: true }
      );
    });
  });

  describe('debounced URL sync for search', () => {
    it('debounces URL update when only searchKeyword changes', () => {
      vi.useFakeTimers();
      mockSearchParams = new URLSearchParams('sort=startDate');
      const { result } = renderHook(() =>
        useActivityTablePreferences(canSeeDeleted)
      );

      act(() => {
        result.current.setPreferences({ sortKey: 'lastUpdated' });
      });
      expect(mockSetSearchParams).toHaveBeenCalled();
      mockSetSearchParams.mockClear();

      act(() => {
        result.current.setPreferences({ searchKeyword: 'foo' });
      });
      expect(mockSetSearchParams).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(mockSetSearchParams).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'foo' }),
        { replace: true }
      );
    });
  });
});

describe('getStoredActivityListSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'sessionStorage', {
      value: makeMockStorage(),
      writable: true,
    });
    sessionStorageGet.mockReturnValue(null);
  });

  it('returns empty string when storage has no preferences', () => {
    expect(getStoredActivityListSearch(true)).toBe('');
  });

  it('returns query string from stored preferences', () => {
    const stored = {
      sortKey: 'lastUpdated',
      sortDirection: 'desc',
      showCompleted: false,
      showDeleted: false,
      pageSize: 10,
      searchKeyword: '',
      filterState: {
        dateRange: {
          startDate: '',
          endDate: '',
          noStartDate: false,
          noEndDate: false,
        },
        categoryIds: [] as number[],
        activityStatusIds: [] as number[],
        pitchRequiredStatusNames: [] as string[],
        pitchDateFilter: { kind: 'any' as const },
        lookAheadStatusValues: [] as string[],
        lookAheadSectionValues: [] as string[],
        dateConfirmedFilter: 'any' as const,
        timeConfirmedFilter: 'any' as const,
        tagIds: [] as number[],
        leadTeamIds: [] as number[],
        commsContactLeadUserIds: [] as number[],
        eventPlannerLeadIds: [] as number[],
        translationRequiredStatusIds: [],
        translationLanguageIds: [],
      },
    };
    sessionStorageGet.mockImplementation((key: string) =>
      key === 'activityTablePreferences' ? JSON.stringify(stored) : null
    );

    const result = getStoredActivityListSearch(true);
    expect(result).toContain('sort=lastUpdated');
    expect(result).toContain('dir=desc');
    expect(result.startsWith('?')).toBe(true);
  });
});
