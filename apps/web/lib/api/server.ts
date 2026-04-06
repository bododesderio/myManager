import 'server-only';

const API_URL = process.env.API_URL || 'http://localhost:3001';

type ServerFetchInit = RequestInit & {
  next?: {
    revalidate?: number;
  };
};

interface ServerApiOptions {
  revalidate?: number;
  label?: string;
  init?: ServerFetchInit;
}

export async function fetchServerApi<T>(
  path: string,
  fallback: T,
  options: ServerApiOptions = {},
): Promise<T> {
  const { revalidate = 300, label = path, init } = options;
  const requestInit: ServerFetchInit = {
    ...init,
    next: init?.next ?? { revalidate },
  };

  try {
    const response = await fetch(`${API_URL}${path}`, requestInit);
    if (!response.ok) {
      console.error(`[server-api] ${label} failed with ${response.status} ${response.statusText}`);
      return fallback;
    }

    const json = await response.json();
    return (json?.data ?? json) as T;
  } catch (error) {
    console.error(`[server-api] ${label} request failed`, error);
    return fallback;
  }
}
