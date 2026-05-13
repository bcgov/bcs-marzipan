import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  addFavourite,
  listFavouriteActivityIds,
  removeFavourite,
} from '@/api/favouritesApi';
import { showErrorToast } from '@/lib/error-toast';

const FAVOURITES_QUERY_KEY = ['activity-favourites'] as const;

const EMPTY_FAVOURITE_IDS: number[] = [];

export function useFavourites() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: FAVOURITES_QUERY_KEY,
    queryFn: listFavouriteActivityIds,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const favouriteActivityIds = data ?? EMPTY_FAVOURITE_IDS;

  const addMutation = useMutation({
    mutationFn: (activityId: number) => addFavourite(activityId),
    onMutate: async (activityId) => {
      await queryClient.cancelQueries({ queryKey: FAVOURITES_QUERY_KEY });
      const previous = queryClient.getQueryData<number[]>(FAVOURITES_QUERY_KEY);
      queryClient.setQueryData<number[]>(FAVOURITES_QUERY_KEY, (old) =>
        old ? [...old, activityId] : [activityId]
      );
      return { previous };
    },
    onError: (_err, _activityId, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(FAVOURITES_QUERY_KEY, context.previous);
      }
      showErrorToast(_err, 'Failed to add activity to favourites');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: FAVOURITES_QUERY_KEY });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (activityId: number) => removeFavourite(activityId),
    onMutate: async (activityId) => {
      await queryClient.cancelQueries({ queryKey: FAVOURITES_QUERY_KEY });
      const previous = queryClient.getQueryData<number[]>(FAVOURITES_QUERY_KEY);
      queryClient.setQueryData<number[]>(FAVOURITES_QUERY_KEY, (old) =>
        old ? old.filter((id) => id !== activityId) : []
      );
      return { previous };
    },
    onError: (_err, _activityId, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(FAVOURITES_QUERY_KEY, context.previous);
      }
      showErrorToast(_err, 'Failed to remove activity from favourites');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: FAVOURITES_QUERY_KEY });
    },
  });

  const isFavourite = (activityId: number) =>
    favouriteActivityIds.includes(activityId);

  const toggle = (activityId: number) => {
    if (isFavourite(activityId)) {
      removeMutation.mutate(activityId);
    } else {
      addMutation.mutate(activityId);
    }
  };

  return {
    favouriteActivityIds,
    isLoading,
    isFavourite,
    toggle,
    isToggling: addMutation.isPending || removeMutation.isPending,
  };
}
