import { supabase } from '@/core/supabase/client';
import { toApiError } from '@/lib/api/errors';

import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

type RetriableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

async function attachAuthHeader(config: InternalAxiosRequestConfig) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  return config;
}

export function attachInterceptors(client: AxiosInstance) {
  client.interceptors.request.use(
    async (config) => {
      config.headers.Accept = 'application/json';

      if (config.data && !config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
      }

      return attachAuthHeader(config);
    },
    (error) => Promise.reject(toApiError(error)),
  );

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config as RetriableConfig | undefined;
      const status = error.response?.status;

      if (status === 401 && config && !config._retry) {
        config._retry = true;

        const { data, error: refreshError } = await supabase.auth.refreshSession();

        if (!refreshError && data.session?.access_token) {
          config.headers.Authorization = `Bearer ${data.session.access_token}`;
          return client.request(config);
        }
      }

      return Promise.reject(toApiError(error));
    },
  );
}
