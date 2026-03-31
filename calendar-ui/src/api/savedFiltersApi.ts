import type {
  CreateSavedFilterBody,
  DuplicateSavedFilterBody,
  SavedFilterListResponse,
  SavedFilterResponse,
  SetMyDefaultSavedFilterBody,
  UpdateSavedFilterBody,
} from '@corpcal/shared/schemas';

import { createLogger } from '../lib/logger';
import api from './axios';

const logger = createLogger('SavedFiltersAPI');

export async function listSavedFilters(
  contextKey: string
): Promise<SavedFilterListResponse> {
  logger.debug('Listing saved filters', { contextKey });

  const res = await api.get<{
    success: boolean;
    data: SavedFilterListResponse;
  }>('/activity-saved-filters', { params: { contextKey } });

  return res.data.data;
}

export async function setMyDefaultSavedFilter(
  body: SetMyDefaultSavedFilterBody
): Promise<{ defaultSavedFilterId: number | null }> {
  logger.debug('Setting my default saved filter', {
    contextKey: body.contextKey,
    savedFilterId: body.savedFilterId,
  });

  const res = await api.patch<{
    success: boolean;
    data: { defaultSavedFilterId: number | null };
  }>('/activity-saved-filters/my-default', body);

  return res.data.data;
}

export async function createSavedFilter(
  body: CreateSavedFilterBody
): Promise<SavedFilterResponse> {
  logger.debug('Creating saved filter', { name: body.name });

  const res = await api.post<{
    success: boolean;
    data: SavedFilterResponse;
  }>('/activity-saved-filters', body);

  return res.data.data;
}

export async function updateSavedFilter(
  id: number,
  body: UpdateSavedFilterBody
): Promise<SavedFilterResponse> {
  logger.debug('Updating saved filter', { id });

  const res = await api.patch<{
    success: boolean;
    data: SavedFilterResponse;
  }>(`/activity-saved-filters/${id}`, body);

  return res.data.data;
}

export async function duplicateSavedFilter(
  id: number,
  body: DuplicateSavedFilterBody = {}
): Promise<SavedFilterResponse> {
  logger.debug('Duplicating saved filter', { id });

  const res = await api.post<{
    success: boolean;
    data: SavedFilterResponse;
  }>(`/activity-saved-filters/${id}/duplicate`, body);

  return res.data.data;
}

export async function deleteSavedFilter(id: number): Promise<void> {
  logger.debug('Deleting saved filter', { id });
  await api.delete(`/activity-saved-filters/${id}`);
}
