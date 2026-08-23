import { api, ApiError } from './client';

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

export interface LoginResult {
  ok: boolean;
  role: string;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const body = new URLSearchParams({ username: email, password });
  return api<LoginResult>('/login', {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
}

export async function register(formData: FormData): Promise<void> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body);
  }
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return api<{ message: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function checkResetToken(token: string): Promise<{ valid: boolean }> {
  return api<{ valid: boolean }>(`/api/auth/reset-token/${encodeURIComponent(token)}`);
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  return api<{ message: string }>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
}

export async function logout(): Promise<void> {
  await fetch('/logout', {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json' },
    redirect: 'manual',
  });
}

export const isAdmin = (user: CurrentUser | null): boolean => user?.role === 'ROLE_ADMIN';
