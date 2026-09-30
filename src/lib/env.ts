import "server-only";

import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

const serverEnvSchema = z.object({
  BACKEND_URL: z.string().url(),
  SESSION_COOKIE_SECURE: z.enum(["true", "false"]),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type ServerEnv = {
  backendApiUrl: string;
  isCookieSecure: boolean;
};

export function parseServerEnv(input: Record<string, string | undefined>): ServerEnv {
  const parsed = serverEnvSchema.parse(input);
  if (parsed.NODE_ENV === "production" && parsed.SESSION_COOKIE_SECURE !== "true") {
    throw new Error("SESSION_COOKIE_SECURE must be true in production.");
  }

  return {
    backendApiUrl: parsed.BACKEND_URL.replace(/\/$/, ""),
    isCookieSecure: parsed.SESSION_COOKIE_SECURE === "true",
  };
}

export function parsePublicEnv(input: Record<string, string | undefined>) {
  const parsed = publicEnvSchema.parse(input);
  return { appUrl: parsed.NEXT_PUBLIC_APP_URL.replace(/\/$/, "") };
}

export function getServerEnv(): ServerEnv {
  return parseServerEnv(process.env);
}

export function getPublicEnv() {
  return parsePublicEnv(process.env);
}
