import { createLogger } from '../lib/logger';
import api from './axios';

const logger = createLogger('FavouritesAPI');

export async function listFavouriteActivityIds(): Promise<number[]> {
  logger.debug('Listing favourite activity IDs');

  const res = await api.get<{
    success: boolean;
    data: { activityIds: number[] };
  }>('/activity-favourites');

  return res.data.data.activityIds;
}

export async function addFavourite(activityId: number): Promise<void> {
  logger.debug('Adding activity to favourites', { activityId });
  await api.post(`/activity-favourites/${activityId}`);
}

export async function removeFavourite(activityId: number): Promise<void> {
  logger.debug('Removing activity from favourites', { activityId });
  await api.delete(`/activity-favourites/${activityId}`);
}
