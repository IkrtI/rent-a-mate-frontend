import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { BackendClientError, requestBackend } from "@/modules/backend-client/client";
import {
  adminAnalyticsSchema,
  adminBookingsPageSchema,
  adminPaymentSchema,
  adminReportSchema,
  adminReportsPageSchema,
  adminUserSchema,
  adminUsersPageSchema,
} from "@/modules/admin/contracts";
import { AdminAccessError, getAdminContext } from "@/modules/admin/server";

const banBodySchema = z.object({ reason: z.string().trim().min(1).max(1000) });
const resolveBodySchema = z.object({
  status: z.enum(["reviewed", "dismissed", "actioned"]),
  resolutionNote: z.string().trim().max(1000).optional(),
});
const bookingMutationSchema = z.object({
  id: z.number(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
});

type AdminRoute = {
  method: string;
  backendPath: string;
  responseSchema: z.ZodType;
  bodySchema?: z.ZodType;
};

function resolveAdminRoute(path: string[], method: string): AdminRoute | null {
  const [section, rawId, action, ...rest] = path;
  if (rest.length > 0) return null;
  if (section === "analytics" && path.length === 1 && method === "GET")
    return { method, backendPath: "admin/analytics", responseSchema: adminAnalyticsSchema };
  if (section === "users" && path.length === 1 && method === "GET")
    return { method, backendPath: "admin/users", responseSchema: adminUsersPageSchema };
  if (section === "bookings" && path.length === 1 && method === "GET")
    return { method, backendPath: "admin/bookings", responseSchema: adminBookingsPageSchema };
  if (section === "reports" && path.length === 1 && method === "GET")
    return { method, backendPath: "admin/reports", responseSchema: adminReportsPageSchema };
  if (!rawId || !/^\d+$/.test(rawId) || Number(rawId) <= 0 || !action) return null;

  const id = Number(rawId);
  if (section === "users" && method === "PATCH") {
    if (action === "ban")
      return {
        method,
        backendPath: `admin/users/${id}/ban`,
        bodySchema: banBodySchema,
        responseSchema: z.object({ user: adminUserSchema }),
      };
    if (["unban", "activate", "verify"].includes(action))
      return {
        method,
        backendPath: `admin/users/${id}/${action}`,
        responseSchema: z.object({ user: adminUserSchema }),
      };
  }
  if (section === "reports" && action === "resolve" && method === "PATCH")
    return {
      method,
      backendPath: `admin/reports/${id}`,
      bodySchema: resolveBodySchema,
      responseSchema: z.object({ report: adminReportSchema }),
    };
  if (section === "bookings" && method === "PATCH" && ["cancel", "complete"].includes(action))
    return {
      method,
      backendPath: `bookings/${id}/${action}`,
      responseSchema: bookingMutationSchema,
    };
  if (section === "bookings" && action === "refund" && method === "POST")
    return {
      method,
      backendPath: `bookings/${id}/payment/refund`,
      responseSchema: adminPaymentSchema,
    };
  return null;
}

async function handle(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const route = resolveAdminRoute(path, request.method);
  if (!route) {
    return NextResponse.json(
      { status: "error", message: "Admin endpoint not found." },
      { status: 404 },
    );
  }

  try {
    const admin = await getAdminContext();
    let body: unknown;
    if (route.bodySchema) {
      const parsed = route.bodySchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) {
        return NextResponse.json(
          { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid request." },
          { status: 400 },
        );
      }
      body = parsed.data;
    }
    const query = request.nextUrl.searchParams.toString();
    const data = await requestBackend({
      path: `${route.backendPath}${query ? `?${query}` : ""}`,
      method: route.method as "GET" | "PATCH" | "POST",
      ...(body === undefined ? {} : { body }),
      responseSchema: route.responseSchema,
      session: admin,
    });
    return NextResponse.json({ status: "success", data });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: error.status },
      );
    }
    if (error instanceof BackendClientError) {
      return NextResponse.json(
        { status: "error", message: error.details.message },
        { status: error.details.status || 503 },
      );
    }
    return NextResponse.json(
      { status: "error", message: "The admin request could not be completed." },
      { status: 503 },
    );
  }
}

export const GET = handle;
export const PATCH = handle;
export const POST = handle;
