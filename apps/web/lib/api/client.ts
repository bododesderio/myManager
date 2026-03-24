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

const apiClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach bearer token and CSRF token
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
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

    // Handle 401 - try refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshRes = await axios.post(
          '/api/v1/auth/refresh',
          {},
          { withCredentials: true },
        );

        const newToken = refreshRes.data?.accessToken;
        if (newToken) {
          setAccessToken(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch {
        // Refresh failed — user needs to re-login
        setAccessToken(null);
        if (typeof window !== 'undefined') {
          window.location.href = '/login?error=session_expired';
        }
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
