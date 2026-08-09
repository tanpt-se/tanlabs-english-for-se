import axios from 'axios';

import { API_BASE_URL } from '@/app/config/env';
import { attachInterceptors } from '@/lib/api/interceptors';

export const api = axios.create({
  baseURL: API_BASE_URL || undefined,
  timeout: 20_000,
});

attachInterceptors(api);

export { ApiError, toApiError } from '@/lib/api/errors';
