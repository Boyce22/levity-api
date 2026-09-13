import type { AppInstance } from '../../src/app';
import { getTestApp } from './app';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiOptions {
  token?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export interface ApiResponse<T = unknown> {
  status: number;
  body: T;
}

function parseBody<T>(response: { body: string; headers: Record<string, unknown> }): T {
  if (!response.body) return undefined as T;
  const contentType = String(response.headers['content-type'] ?? '');
  if (contentType.includes('application/json') || response.body.startsWith('{') || response.body.startsWith('[') || response.body.startsWith('"')) {
    try {
      return JSON.parse(response.body) as T;
    } catch {
      return response.body as T;
    }
  }
  return response.body as T;
}

export async function api<T = unknown>(
  method: HttpMethod,
  url: string,
  options: ApiOptions = {},
): Promise<ApiResponse<T>> {
  const app = await getTestApp();
  const response = await app.inject({
    method,
    url,
    headers: {
      ...(options.body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
    payload: options.body as never,
  });

  return {
    status: response.statusCode,
    body: parseBody<T>(response),
  };
}

export async function uploadMultipart<T = unknown>(
  url: string,
  token: string,
  form: FormData,
): Promise<ApiResponse<T>> {
  const app: AppInstance = await getTestApp();
  const response = await app.inject({
    method: 'POST',
    url,
    headers: {
      authorization: `Bearer ${token}`,
    },
    payload: form,
  });

  return {
    status: response.statusCode,
    body: parseBody<T>(response),
  };
}
