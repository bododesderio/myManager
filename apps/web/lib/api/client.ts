import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '@mymanager/types';

let accessToken: string | null = null;
let csrfToken: string | null = null;
let csrfFetchPromise: Promise<string> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

// Auth-readiness gate. The in-memory access token is populated by AuthSync only
// after the NextAuth session resolves. Requests fired on a fresh page load can
// race ahead of that and go out tokenless → 401 → refresh → redirect bounce.
// Authenticated requests wait (bounded) for auth to settle so the bearer token
// is attached first.
let authSettled = false;
let resolveAuthSettled: () => void = () => {};
const authSettledPromise = new Promise<void>((resolve) => {
  resolveAuthSettled = resolve;
});

/** Called by AuthSync once the session status is known (authenticated or not). */
export function markAuthSettled() {
  if (!authSettled) {
    authSettled = true;
    resolveAuthSettled();
  }
}

/**
 * Fetch a CSRF token from the server (double-submit cookie pattern).
 * The server sets the `_csrf` cookie and returns the token in the body.
 * We send it back as the `x-csrf-token` header on state-changing requests.
 */
async function fetchCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;

  // Deduplicate concurrent requests for the CSRF token
  if (csrfFetchPromise) return csrfFetchPromise;

  csrfFetchPromise = axios
    .get('/api/v1/auth/csrf-token', { withCredentials: true })
    .then((res) => {
      csrfToken = res.data?.csrfToken ?? null;
      csrfFetchPromise = null;
      return csrfToken!;
    })
    .catch((err) => {
      csrfFetchPromise = null;
      throw err;
    });

  return csrfFetchPromise;
}

export function clearCsrfToken() {
  csrfToken = null;
}

// Single-flight refresh. A dashboard can fire many authed requests at once; if
// the access token has expired they all 401 together. Without deduplication each
// one POSTs /auth/refresh, stampeding the endpoint (which is rate-limited) and
// logging the user out. Concurrent 401s now share one refresh and retry with the
// resulting token.
let refreshPromise: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post('/api/v1/auth/refresh', {}, { withCredentials: true })
      .then((res) => {
        const token = res.data?.accessToken ?? null;
        setAccessToken(token);
        return token;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

const apiClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach bearer token and CSRF token
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // Wait for the session to settle so the bearer token (if any) is set — unless
  // this is a pre-auth request (login/register) that must never block on it.
  // Bounded by a timeout so a stuck session can't hang requests forever.
  if (!authSettled && !(config as { skipAuthRefresh?: boolean }).skipAuthRefresh) {
    await Promise.race([
      authSettledPromise,
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
  }

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  // Attach CSRF token on state-changing requests
  const method = (config.method ?? '').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    try {
      const token = await fetchCsrfToken();
      if (token) {
        config.headers['x-csrf-token'] = token;
      }
    } catch {
      // If we can't fetch a CSRF token, proceed without it.
      // The server will reject if protection is required.
    }
  }

  return config;
});

// Response interceptor: unwrap ApiResponse, handle errors
// NOTE: This interceptor returns the unwrapped data (not AxiosResponse).
// Callers receive the parsed JSON body directly.
apiClient.interceptors.response.use(
  (response: AxiosResponse): any => {
    const data = response.data;
    // If the API returns { success, data }, unwrap it
    if (data && typeof data === 'object' && 'success' in data && data.success) {
      return data.data !== undefined ? data.data : data;
    }
    return data;
  },
  async (error: any) => {
    const originalRequest = error.config;

    // Handle 403 with CSRF message - refetch token and retry once
    if (
      error.response?.status === 403 &&
      error.response?.data?.message?.includes('CSRF') &&
      !originalRequest._csrfRetry
    ) {
      originalRequest._csrfRetry = true;
      csrfToken = null;
      try {
        const token = await fetchCsrfToken();
        if (token) {
          originalRequest.headers['x-csrf-token'] = token;
          return apiClient(originalRequest);
        }
      } catch {
        // Fall through to normal error handling
      }
    }

    // Handle 401 - try refresh.
    // `skipAuthRefresh` opts a request out of this: credential submissions
    // (login/register) legitimately return 401 on bad input, and must surface
    // that to the caller rather than triggering a refresh + redirect loop.
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.skipAuthRefresh
    ) {
      originalRequest._retry = true;

      // Shared refresh: concurrent 401s await one in-flight call, not N.
      const newToken = await refreshAccessToken();
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }

      // Refresh failed — user needs to re-login.
      if (typeof window !== 'undefined') {
        window.location.href = '/login?error=session_expired';
      }
    }

    // Normalize error response
    const apiError: ApiError = error.response?.data || {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred',
      },
    };

    return Promise.reject(apiError);
  },
);

// Export a typed version that reflects the interceptor's unwrapping behavior.
// The response interceptor returns raw data (not AxiosResponse), so callers
// receive the parsed JSON body directly.
const api = apiClient as unknown as {
  get: <T = any>(url: string, config?: any) => Promise<T>;
  post: <T = any>(url: string, data?: any, config?: any) => Promise<T>;
  put: <T = any>(url: string, data?: any, config?: any) => Promise<T>;
  patch: <T = any>(url: string, data?: any, config?: any) => Promise<T>;
  delete: <T = any>(url: string, config?: any) => Promise<T>;
  request: <T = any>(config: any) => Promise<T>;
};

export { api as apiClient };
