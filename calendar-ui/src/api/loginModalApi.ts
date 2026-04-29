import type {
  LoginModalSettings,
  UpsertLoginModalSettingsBody,
} from '@corpcal/shared/api/types';

import api from './axios';

type WrappedResponse<T> = {
  success: true;
  data: T;
};

export async function fetchActiveLoginModal(): Promise<LoginModalSettings | null> {
  const res =
    await api.get<WrappedResponse<LoginModalSettings | null>>('/login-modal');
  return res.data.data;
}

export async function fetchLoginModalSettings(): Promise<LoginModalSettings | null> {
  const res = await api.get<WrappedResponse<LoginModalSettings | null>>(
    '/login-modal/settings'
  );
  return res.data.data;
}

export async function upsertLoginModalSettings(
  data: UpsertLoginModalSettingsBody
): Promise<LoginModalSettings> {
  const res = await api.put<WrappedResponse<LoginModalSettings>>(
    '/login-modal/settings',
    data
  );
  return res.data.data;
}
