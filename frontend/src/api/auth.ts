import { api } from './client';

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: string;
  profileImage: string | null;
  cartCount: number;
}

export function fetchCurrentUser(): Promise<CurrentUser> {
  return api<CurrentUser>('/api/auth/me');
}

export async function logout(): Promise<void> {
  await fetch('/logout', { method: 'POST', credentials: 'include' });
}

export const isAdmin = (user: CurrentUser | null): boolean => user?.role === 'ROLE_ADMIN';
