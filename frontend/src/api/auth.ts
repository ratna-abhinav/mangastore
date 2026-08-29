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

export interface RegisterResult {
  success: boolean;
  message: string;
}

export async function register(formData: FormData): Promise<RegisterResult> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body);
  }
  return (await res.json()) as RegisterResult;
}

export interface AuthConfig {
  activationMode: string;
  emailVerification: boolean;
  adminApproval: boolean;
  googleEnabled: boolean;
}

export function fetchAuthConfig(): Promise<AuthConfig> {
  return api<AuthConfig>('/api/auth/config');
}

export async function verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
  return api<{ success: boolean; message: string }>('/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function resendVerification(email: string): Promise<{ message: string }> {
  return api<{ message: string }>('/api/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
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
