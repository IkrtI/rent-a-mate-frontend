"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, X } from "lucide-react";
import Link from "next/link";

import { listNotifications, markAllNotificationsRead, markNotificationRead } from "../client";

export function NotificationPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listNotifications(),
    enabled: open,
  });
  const markOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/20" onMouseDown={onClose}>
      <aside
        aria-label="Notifications"
        className="ml-auto flex h-full w-full max-w-sm flex-col bg-white shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex h-16 items-center gap-3 border-b border-neutral-200 px-5">
          <Bell aria-hidden size={18} />
          <h2 className="font-bold">Notifications</h2>
          <button
            className="ml-auto grid size-9 place-items-center rounded-md hover:bg-neutral-100"
            onClick={onClose}
            title="Close notifications"
            type="button"
          >
            <X aria-hidden size={18} />
          </button>
        </div>
        <div className="flex items-center justify-end border-b border-neutral-100 px-5 py-3">
          <button
            className="inline-flex items-center gap-2 text-xs font-bold text-[#d74653] disabled:opacity-50"
            disabled={markAll.isPending || !query.data?.notifications.some((item) => !item.isRead)}
            onClick={() => markAll.mutate()}
            type="button"
          >
            <CheckCheck aria-hidden size={15} /> Mark all read
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {query.isPending ? (
            <p className="p-5 text-sm text-neutral-600">Loading updates...</p>
          ) : null}
          {query.isError ? (
            <p className="p-5 text-sm text-red-600">Updates could not be loaded.</p>
          ) : null}
          {query.data?.notifications.length === 0 ? (
            <p className="p-8 text-center text-sm text-neutral-500">You are all caught up.</p>
          ) : null}
          {query.data?.notifications.map((item) => {
            const content = (
              <>
                <span className="block text-sm font-semibold text-neutral-900">{item.message}</span>
                <span className="mt-1 block text-xs text-neutral-500">
                  {new Intl.DateTimeFormat("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "Asia/Bangkok",
                  }).format(new Date(item.createdAt))}
                </span>
              </>
            );
            const className = `block border-b border-neutral-100 px-5 py-4 hover:bg-neutral-50 ${
              item.isRead ? "bg-white" : "bg-[#fff3f2]"
            }`;
            return item.bookingId ? (
              <Link
                className={className}
                href={`/bookings/${item.bookingId}`}
                key={item.id}
                onClick={() => {
                  if (!item.isRead) markOne.mutate(item.id);
                  onClose();
                }}
              >
                {content}
              </Link>
            ) : (
              <button
                className={`${className} w-full text-left`}
                key={item.id}
                onClick={() => !item.isRead && markOne.mutate(item.id)}
                type="button"
              >
                {content}
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
