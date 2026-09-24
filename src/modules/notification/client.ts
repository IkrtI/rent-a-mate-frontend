"use client";

import { z } from "zod";

import { requestSameOrigin } from "@/modules/backend-client/browser";
import { notificationSchema, notificationsSchema } from "./schemas";

export function listNotifications(unreadOnly = false) {
  return requestSameOrigin(
    `/api/notifications${unreadOnly ? "?unreadOnly=true" : ""}`,
    notificationsSchema,
  );
}

export function markNotificationRead(notificationId: number) {
  return requestSameOrigin(
    `/api/notifications/${notificationId}/read`,
    z.object({ notification: notificationSchema }),
    { method: "PATCH" },
  );
}

export function markAllNotificationsRead() {
  return requestSameOrigin(
    "/api/notifications/read-all",
    z.object({ updated: z.number().int().nonnegative() }),
    { method: "PATCH" },
  );
}
