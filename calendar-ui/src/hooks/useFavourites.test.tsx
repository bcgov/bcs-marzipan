import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import {
  addFavourite,
  listFavouriteActivityIds,
  removeFavourite,
} from '@/api/favouritesApi';
import { showErrorToast } from '@/lib/error-toast';

import { useFavourites } from './useFavourites';

vi.mock('@/api/favouritesApi', () => ({
  listFavouriteActivityIds: vi.fn(),
  addFavourite: vi.fn(),
  removeFavourite: vi.fn(),
}));

vi.mock('@/lib/error-toast', () => ({
  showErrorToast: vi.fn(),
}));

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
}

describe('useFavourites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('isFavourite', () => {
    it('returns true for an activity in the list', async () => {
      vi.mocked(listFavouriteActivityIds).mockResolvedValue([1, 2, 3]);

      const { result } = renderHook(() => useFavourites(), {
        wrapper: makeWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.isFavourite(2)).toBe(true);
      expect(result.current.isFavourite(99)).toBe(false);
    });

    it('returns false for all activities while loading', () => {
      vi.mocked(listFavouriteActivityIds).mockReturnValue(
        new Promise(() => {})
      );

      const { result } = renderHook(() => useFavourites(), {
        wrapper: makeWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isFavourite(1)).toBe(false);
    });
  });

  describe('toggle — add path', () => {
    it('calls addFavourite when activity is not yet favourited', async () => {
      vi.mocked(listFavouriteActivityIds).mockResolvedValue([]);
      vi.mocked(addFavourite).mockResolvedValue(undefined);

      const { result } = renderHook(() => useFavourites(), {
        wrapper: makeWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.toggle(5);
      });

      await waitFor(() => expect(addFavourite).toHaveBeenCalledWith(5));
      expect(removeFavourite).not.toHaveBeenCalled();
    });

    it('optimistically adds the id before the request settles', async () => {
      vi.mocked(listFavouriteActivityIds).mockResolvedValue([]);
      vi.mocked(addFavourite).mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useFavourites(), {
        wrapper: makeWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.toggle(7);
      });

      await waitFor(() => expect(result.current.isFavourite(7)).toBe(true));
    });
  });

  describe('toggle — remove path', () => {
    it('calls removeFavourite when activity is already favourited', async () => {
      vi.mocked(listFavouriteActivityIds).mockResolvedValue([5]);
      vi.mocked(removeFavourite).mockResolvedValue(undefined);

      const { result } = renderHook(() => useFavourites(), {
        wrapper: makeWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.toggle(5);
      });

      await waitFor(() => expect(removeFavourite).toHaveBeenCalledWith(5));
      expect(addFavourite).not.toHaveBeenCalled();
    });

    it('optimistically removes the id before the request settles', async () => {
      vi.mocked(listFavouriteActivityIds).mockResolvedValue([5]);
      vi.mocked(removeFavourite).mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useFavourites(), {
        wrapper: makeWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.toggle(5);
      });

      await waitFor(() => expect(result.current.isFavourite(5)).toBe(false));
    });
  });

  describe('optimistic rollback on error', () => {
    it('restores previous state and shows error toast when add fails', async () => {
      vi.mocked(listFavouriteActivityIds).mockResolvedValue([1]);
      vi.mocked(addFavourite).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useFavourites(), {
        wrapper: makeWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.toggle(9);
      });

      await waitFor(() =>
        expect(showErrorToast).toHaveBeenCalledWith(
          expect.any(Error),
          'Failed to add activity to favourites'
        )
      );

      // Original list restored — 9 should no longer be present
      expect(result.current.isFavourite(9)).toBe(false);
    });

    it('restores previous state and shows error toast when remove fails', async () => {
      vi.mocked(listFavouriteActivityIds).mockResolvedValue([1]);
      vi.mocked(removeFavourite).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useFavourites(), {
        wrapper: makeWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.toggle(1);
      });

      await waitFor(() =>
        expect(showErrorToast).toHaveBeenCalledWith(
          expect.any(Error),
          'Failed to remove activity from favourites'
        )
      );

      expect(result.current.isFavourite(1)).toBe(true);
    });
  });
});
