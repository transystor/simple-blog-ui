import type { Article, SiteSettings } from '../types';

const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ accessToken: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  getArticles: () => request<Article[]>('/api/articles'),
  getArticle: (slug: string) => request<Article>(`/api/articles/${slug}`),
  getSiteSettings: () => request<SiteSettings>('/api/site-settings'),
  getAdminArticles: (token: string) =>
    request<Article[]>('/api/admin/articles', {
      headers: { Authorization: `Bearer ${token}` }
    }),
  updateSiteSettings: (token: string, payload: SiteSettings) =>
    request<SiteSettings>('/api/admin/site-settings', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    }),
  createArticle: (token: string, payload: Partial<Article>) =>
    request<Article>('/api/admin/articles', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    }),
  updateArticle: (token: string, id: string, payload: Partial<Article>) =>
    request<Article>(`/api/admin/articles/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    }),
  deleteArticle: (token: string, id: string) =>
    request<void>(`/api/admin/articles/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
};
