import type { AxiosError } from 'axios';

export type ApiErrorBody = {
  message?: string;
  error?: string;
  code?: string | number;
};

export class ApiError extends Error {
  readonly status?: number;
  readonly code?: string | number;
  readonly data?: unknown;

  constructor(
    message: string,
    options?: { status?: number; code?: string | number; data?: unknown },
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = options?.status;
    this.code = options?.code;
    this.data = options?.data;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  const axiosError = error as AxiosError<ApiErrorBody>;
  const status = axiosError.response?.status;
  const data = axiosError.response?.data;
  const message = data?.message || data?.error || axiosError.message || 'Unexpected network error';

  return new ApiError(message, {
    status,
    code: data?.code ?? axiosError.code,
    data,
  });
}
