import api from './axios.js';
import { createLogger } from '../lib/logger';

const logger = createLogger('DraftsAPI');

export interface SaveDraftRequest {
  formType: string;
  entityId?: number;
  draftData: Record<string, any>;
}

export interface DraftResponse {
  id: number;
  userId: number;
  formType: string;
  entityId?: number | null;
  draftData: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string | null;
}

export interface DraftsListResponse {
  drafts: DraftResponse[];
  count: number;
}

/**
 * Save or update a draft
 */
export async function saveDraft(
  userId: number,
  draftRequest: SaveDraftRequest
): Promise<DraftResponse> {
  logger.debug('Saving draft', { userId, formType: draftRequest.formType });

  try {
    const res = await api.post<{ success: boolean; data: DraftResponse }>(
      '/drafts/save',
      draftRequest,
      {
        params: { userId },
      }
    );
    logger.debug('Draft saved successfully', { draftId: res.data.data.id });
    return res.data.data;
  } catch (error) {
    logger.error('Failed to save draft', error);
    throw error;
  }
}

/**
 * Get a specific draft by form type and optional entity ID
 */
export async function getDraft(
  userId: number,
  formType: string,
  entityId?: number
): Promise<DraftResponse | null> {
  logger.debug('Fetching draft', { userId, formType, entityId });

  try {
    const res = await api.get<{ success: boolean; data: DraftResponse | null }>(
      '/drafts',
      {
        params: { userId, formType, entityId },
      }
    );
    return res.data.data;
  } catch (error) {
    logger.error('Failed to fetch draft', error);
    throw error;
  }
}

/**
 * Get all drafts for a user
 */
export async function listDrafts(userId: number): Promise<DraftsListResponse> {
  logger.debug('Listing drafts', { userId });

  try {
    const res = await api.get<{ success: boolean; data: DraftsListResponse }>(
      '/drafts/list',
      {
        params: { userId },
      }
    );
    return res.data.data;
  } catch (error) {
    logger.error('Failed to list drafts', error);
    throw error;
  }
}

/**
 * Delete a draft by ID
 */
export async function deleteDraft(
  userId: number,
  draftId: number
): Promise<void> {
  logger.debug('Deleting draft', { userId, draftId });

  try {
    await api.delete(`/drafts/${draftId}`, {
      params: { userId },
    });
    logger.debug('Draft deleted successfully', { draftId });
  } catch (error) {
    logger.error('Failed to delete draft', error);
    throw error;
  }
}

/**
 * Delete a draft by form type and entity ID
 */
export async function deleteDraftByForm(
  userId: number,
  formType: string,
  entityId?: number
): Promise<void> {
  logger.debug('Deleting draft by form', { userId, formType, entityId });

  try {
    await api.delete('/drafts/by-form', {
      params: { userId, formType, entityId },
    });
    logger.debug('Draft deleted successfully');
  } catch (error) {
    logger.error('Failed to delete draft by form', error);
    throw error;
  }
}
