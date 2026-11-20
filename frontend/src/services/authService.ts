import type { UserProfile } from '../types';
import { api } from './storageService';

export async function login(email: string, password: string): Promise<UserProfile> {
  const result = await api<{ user: UserProfile }>('/login', 'POST', { email, password });
  return result.user;
}
export async function session(): Promise<UserProfile | null> {
  try { return (await api<{ user: UserProfile }>('/session')).user; }
  catch { return null; }
}
export const logout = (): Promise<unknown> => api('/logout', 'POST', {});
export const changePassword = (currentPassword: string, newPassword: string): Promise<unknown> =>
  api('/password', 'POST', { currentPassword, newPassword });
