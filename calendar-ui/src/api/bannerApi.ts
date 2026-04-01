import type {
  BannerSettings,
  UpsertBannerSettingsBody,
} from '@corpcal/shared/api/types';

import api from './axios';

type WrappedResponse<T> = {
  success: true;
  data: T;
};

export async function fetchActiveBanner(): Promise<BannerSettings | null> {
  const res = await api.get<WrappedResponse<BannerSettings | null>>('/banner');
  return res.data.data;
}

export async function fetchBannerSettings(): Promise<BannerSettings | null> {
  const res =
    await api.get<WrappedResponse<BannerSettings | null>>('/banner/settings');
  return res.data.data;
}

export async function upsertBannerSettings(
  data: UpsertBannerSettingsBody
): Promise<BannerSettings> {
  const res = await api.put<WrappedResponse<BannerSettings>>(
    '/banner/settings',
    data
  );
  return res.data.data;
}
