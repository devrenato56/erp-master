import { getSupabase } from "./supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await getSupabase().auth.getSession();
  if (!session) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function apiFetchForm<T>(path: string, body: FormData, method = "POST"): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { ...authHeaders as Record<string, string> },
    body,
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    const err = new Error(b?.detail ?? `Error ${res.status}`) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const error = new Error(body?.detail ?? `Error ${res.status}`) as Error & { status: number };
    error.status = res.status;
    throw error;
  }

  return res.json() as Promise<T>;
}
