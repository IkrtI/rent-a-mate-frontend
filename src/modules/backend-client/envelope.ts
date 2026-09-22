import { z } from "zod";

import type { AppError } from "./types";

const envelopeSchema = z.object({
  data: z.unknown().refine((value) => value !== undefined, { message: "data is required" }),
  message: z.string(),
  status: z.literal("success"),
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function unwrapEnvelope<T>(
  payload: unknown,
  dataSchema: z.ZodType<T> = z.unknown() as z.ZodType<T>,
): T {
  return dataSchema.parse(envelopeSchema.parse(payload).data);
}

export function normalizeBackendError(status: number, payload: unknown): AppError {
  const body = isRecord(payload) ? payload : {};
  const messages = Array.isArray(body.message)
    ? body.message.filter((message): message is string => typeof message === "string")
    : typeof body.message === "string"
      ? [body.message]
      : [];
  const fieldErrors = messages.reduce<Record<string, string[]>>((errors, message) => {
    const field = message.match(/^([a-zA-Z][a-zA-Z0-9_]*)\s/)?.[1];
    if (field) {
      errors[field] = [...(errors[field] ?? []), message];
    }
    return errors;
  }, {});

  return {
    status,
    code:
      typeof body.error === "string"
        ? body.error
            .toUpperCase()
            .replaceAll(/[^A-Z0-9]+/g, "_")
            .replace(/^_|_$/g, "")
        : status === 400
          ? "BAD_REQUEST"
          : `HTTP_${status}`,
    message: messages[0] ?? "The request could not be completed.",
    ...(Object.keys(fieldErrors).length > 0 ? { fieldErrors } : {}),
    retryable: status === 408 || status === 429 || status >= 500,
  };
}

export function normalizeNetworkError(): AppError {
  return {
    status: 0,
    code: "NETWORK_ERROR",
    message: "The network request could not be completed.",
    retryable: true,
  };
}
