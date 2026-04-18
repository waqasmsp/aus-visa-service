const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

const assertSupabaseConfig = (): void => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Dashboard database access is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
};

const buildUrl = (path: string, params?: Record<string, string>): string => {
  assertSupabaseConfig();
  const url = new URL(`${SUPABASE_URL}/rest/v1/${path}`);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== '') url.searchParams.set(key, value);
  });
  return url.toString();
};

export const dashboardDbFetch = async <T>(path: string, init?: RequestInit, params?: Record<string, string>): Promise<T> => {
  const response = await fetch(buildUrl(path, params), {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'content-type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(payload.message ?? `Database request failed (${response.status}).`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};
