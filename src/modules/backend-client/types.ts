export type AppError = {
  status: number;
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  requestId?: string;
  retryable: boolean;
};

export type BackendEnvelope<T> = {
  data: T;
  message?: string;
};
