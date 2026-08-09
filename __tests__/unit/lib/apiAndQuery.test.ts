import { supabase } from '@/core/supabase/client';
import { ApiError, toApiError } from '@/lib/api/errors';
import { attachInterceptors } from '@/lib/api/interceptors';
import { clearPersistedQueryCache, queryPersistenceOptions } from '@/lib/queryClient';

jest.mock('@/core/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      refreshSession: jest.fn(),
    },
  },
}));

jest.mock('@/app/config/env', () => ({
  API_BASE_URL: 'https://api.example.test',
}));

describe('api client module', () => {
  it('creates the shared axios instance with interceptors', () => {
    jest.isolateModules(() => {
      const { api } = require('@/lib/api/client') as typeof import('@/lib/api/client');
      expect(api.defaults.timeout).toBe(20_000);
      expect(api.defaults.baseURL).toBe('https://api.example.test');
    });
  });
});

describe('api errors', () => {
  it('preserves ApiError instances and maps axios failures', () => {
    const existing = new ApiError('already', { status: 400, code: 'bad' });
    expect(toApiError(existing)).toBe(existing);

    const mapped = toApiError({
      message: 'Request failed',
      response: {
        status: 500,
        data: { message: 'Boom', code: 'server' },
      },
    });
    expect(mapped).toBeInstanceOf(ApiError);
    expect(mapped.message).toBe('Boom');
    expect(mapped.status).toBe(500);
    expect(mapped.code).toBe('server');

    const viaErrorField = toApiError({
      message: '',
      response: { status: 400, data: { error: 'bad request' } },
    });
    expect(viaErrorField.message).toBe('bad request');

    const fallback = toApiError({});
    expect(fallback.message).toBe('Unexpected network error');
  });
});

describe('api interceptors', () => {
  it('attaches JSON Accept headers and bearer tokens on request', async () => {
    const client = {
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
      request: jest.fn(),
    };
    attachInterceptors(client as never);

    const onFulfilled = jest.mocked(client.interceptors.request.use).mock.calls[0][0] as (
      config: Record<string, unknown>,
    ) => Promise<Record<string, unknown>>;

    jest.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: 'token-1' } },
      error: null,
    } as never);

    const next = await onFulfilled({
      headers: {},
      data: { hello: 'world' },
    });
    expect(next.headers).toMatchObject({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Bearer token-1',
    });
  });

  it('retries once after a successful session refresh on 401', async () => {
    const client = {
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
      request: jest.fn(async () => ({ data: { ok: true } })),
    };
    attachInterceptors(client as never);

    const onRejected = jest.mocked(client.interceptors.response.use).mock.calls[0][1] as (
      error: unknown,
    ) => Promise<unknown>;

    jest.mocked(supabase.auth.refreshSession).mockResolvedValue({
      data: { session: { access_token: 'fresh-token' } },
      error: null,
    } as never);

    const config = { headers: {} as Record<string, string>, _retry: false };
    await expect(
      onRejected({
        config,
        response: { status: 401, data: { message: 'expired' } },
      }),
    ).resolves.toEqual({ data: { ok: true } });
    expect(config.headers.Authorization).toBe('Bearer fresh-token');
    expect(client.request).toHaveBeenCalledWith(config);
  });

  it('maps non-401 failures and skips a second retry', async () => {
    const client = {
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
      request: jest.fn(),
    };
    attachInterceptors(client as never);
    const onRequestRejected = jest.mocked(client.interceptors.request.use).mock.calls[0][1] as (
      error: unknown,
    ) => Promise<unknown>;
    const onRejected = jest.mocked(client.interceptors.response.use).mock.calls[0][1] as (
      error: unknown,
    ) => Promise<unknown>;

    await expect(onRequestRejected({ message: 'offline' })).rejects.toMatchObject({
      name: 'ApiError',
      message: 'offline',
    });

    await expect(
      onRejected({
        config: { headers: {}, _retry: true },
        response: { status: 401, data: { message: 'still expired' } },
      }),
    ).rejects.toMatchObject({ message: 'still expired', status: 401 });

    await expect(
      onRejected({
        config: { headers: {} },
        response: { status: 500, data: { message: 'boom' } },
      }),
    ).rejects.toMatchObject({ message: 'boom', status: 500 });
  });

  it('skips Content-Type and auth header when absent', async () => {
    const client = {
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
      request: jest.fn(),
    };
    attachInterceptors(client as never);
    const onFulfilled = jest.mocked(client.interceptors.request.use).mock.calls[0][0] as (
      config: Record<string, unknown>,
    ) => Promise<Record<string, unknown>>;
    jest.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as never);
    const next = await onFulfilled({ headers: { 'Content-Type': 'text/plain' } });
    expect(next.headers).toMatchObject({
      Accept: 'application/json',
      'Content-Type': 'text/plain',
    });
    expect((next.headers as Record<string, string>).Authorization).toBeUndefined();
  });
});

describe('queryClient persistence policy', () => {
  it('only dehydrates remote-config queries', () => {
    expect(
      queryPersistenceOptions.dehydrateOptions.shouldDehydrateQuery({
        queryKey: ['remote-config', 'feature-flags'],
      }),
    ).toBe(true);
    expect(
      queryPersistenceOptions.dehydrateOptions.shouldDehydrateQuery({
        queryKey: ['profile', 'user-1'],
      }),
    ).toBe(false);
  });

  it('clears the in-memory and persisted clients', async () => {
    const removeClient = jest
      .spyOn(queryPersistenceOptions.persister, 'removeClient')
      .mockResolvedValue(undefined);
    await clearPersistedQueryCache();
    expect(removeClient).toHaveBeenCalled();
  });
});
