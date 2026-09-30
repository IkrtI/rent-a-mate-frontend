"use client";

import { z } from "zod";

import type { AppError } from "./types";

const errorSchema = z.object({
  error: z.object({
    status: z.number(),
    code: z.string(),
    message: z.string(),
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
    retryable: z.boolean(),
  }),
});

export class BrowserClientError extends Error {
  constructor(readonly details: AppError) {
    super(details.message);
    this.name = "BrowserClientError";
  }
}

export async function requestSameOrigin<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });
  const payload: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    const parsed = errorSchema.safeParse(payload);
    throw new BrowserClientError(
      parsed.success
        ? parsed.data.error
        : {
            status: response.status,
            code: response.status === 401 ? "SESSION_REQUIRED" : "REQUEST_FAILED",
            message: "The request could not be completed.",
            retryable: response.status >= 500,
          },
    );
  }
  return schema.parse(payload);
}

export function requestSameOriginUpload<T>(
  path: string,
  schema: z.ZodType<T>,
  body: FormData,
  onProgress: (percentage: number) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", path);
    request.setRequestHeader("Accept", "application/json");
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable)
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    });
    request.addEventListener("error", () =>
      reject(
        new BrowserClientError({
          status: 0,
          code: "NETWORK_ERROR",
          message: "The network request could not be completed.",
          retryable: true,
        }),
      ),
    );
    request.addEventListener("load", () => {
      let payload: unknown;
      try {
        payload = JSON.parse(request.responseText);
      } catch {
        payload = undefined;
      }
      if (request.status < 200 || request.status >= 300) {
        const parsed = errorSchema.safeParse(payload);
        reject(
          new BrowserClientError(
            parsed.success
              ? parsed.data.error
              : {
                  status: request.status,
                  code: request.status === 401 ? "SESSION_REQUIRED" : "REQUEST_FAILED",
                  message: "The request could not be completed.",
                  retryable: request.status >= 500,
                },
          ),
        );
        return;
      }
      try {
        resolve(schema.parse(payload));
      } catch (error) {
        reject(error);
      }
    });
    request.send(body);
  });
}
