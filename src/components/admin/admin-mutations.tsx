"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, ShieldCheck, UserRoundX } from "lucide-react";

import type { AdminBooking, AdminReport, AdminUser } from "@/modules/admin/contracts";

async function mutate(path: string, method: "PATCH" | "POST", body?: unknown) {
  const response = await fetch(path, {
    method,
    headers:
      body === undefined ? { Accept: "application/json" } : { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : "The action could not be completed.";
    throw new Error(
      response.status === 401 ? "Your admin session expired. Sign in again." : message,
    );
  }
}

function ConfirmationDialog({
  title,
  description,
  actionLabel,
  busy,
  error,
  onCancel,
  onConfirm,
  children,
  danger = false,
}: {
  title: string;
  description: string;
  actionLabel: string;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: (event: React.FormEvent<HTMLFormElement>) => void;
  children?: React.ReactNode;
  danger?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return (
    <dialog
      aria-labelledby={titleId}
      className="admin-resolution-dialog"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      ref={dialog}
    >
      <form className="admin-dialog-inner" onSubmit={onConfirm}>
        <div>
          <p className="admin-overline">CONFIRM ADMIN ACTION</p>
          <h3 id={titleId}>{title}</h3>
        </div>
        <p>{description}</p>
        {children}
        {error && (
          <p className="admin-form-alert" role="alert">
            {error}
          </p>
        )}
        <div className="admin-dialog-actions">
          <button
            className="admin-secondary-button"
            disabled={busy}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className={danger ? "admin-danger-button" : "admin-primary-button"}
            disabled={busy}
            type="submit"
          >
            {busy ? <LoaderCircle className="admin-spin" aria-hidden="true" size={15} /> : null}
            {busy ? "Working…" : actionLabel}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export function AdminUserActions({
  user,
  currentAdminId,
}: {
  user: AdminUser;
  currentAdminId: number;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"ban" | "unban" | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const canBan = user.id !== currentAdminId && !user.isBanned;

  async function run(action: string, body?: unknown) {
    setBusy(true);
    setError("");
    try {
      await mutate(`/api/admin/users/${user.id}/${action}`, "PATCH", body);
      setMessage(
        action === "verify"
          ? "Mate verified"
          : action === "activate"
            ? "Account activated"
            : "Access updated",
      );
      setMode(null);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The action could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  function submitDialog(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "ban") void run("ban", { reason });
    if (mode === "unban") void run("unban");
  }

  return (
    <div>
      <div className="admin-row-actions">
        {canBan && (
          <button
            className="admin-text-button admin-text-danger"
            onClick={() => {
              setError("");
              setMode("ban");
            }}
            type="button"
          >
            <UserRoundX aria-hidden="true" size={14} /> Ban
          </button>
        )}
        {user.isBanned && (
          <button
            className="admin-text-button"
            onClick={() => {
              setError("");
              setMode("unban");
            }}
            type="button"
          >
            Unban
          </button>
        )}
        {!user.isActive && (
          <button
            className="admin-text-button"
            disabled={busy}
            onClick={() => void run("activate")}
            type="button"
          >
            Activate
          </button>
        )}
        {user.role === "mate" && !user.isVerified && (
          <button
            className="admin-text-button"
            disabled={busy}
            onClick={() => void run("verify")}
            type="button"
          >
            <ShieldCheck aria-hidden="true" size={14} /> Verify
          </button>
        )}
        {user.isVerified && user.role === "mate" && (
          <span aria-label="Mate is verified" className="admin-verified-mark">
            <Check size={13} /> Verified
          </span>
        )}
      </div>
      {error && (
        <p className="admin-inline-error" role="alert">
          {error}
        </p>
      )}
      {message && !error && (
        <p className="admin-inline-success" role="status">
          {message}
        </p>
      )}
      {mode && (
        <ConfirmationDialog
          actionLabel={mode === "ban" ? "Ban account" : "Unban account"}
          busy={busy}
          danger={mode === "ban"}
          description={
            mode === "ban"
              ? `Banning ${user.name} immediately revokes active sessions and blocks account access until restored.`
              : `Restore sign-in access for ${user.name}?`
          }
          error={error}
          onCancel={() => setMode(null)}
          onConfirm={submitDialog}
          title={mode === "ban" ? "Restrict this account?" : "Restore this account?"}
        >
          {mode === "ban" && (
            <label className="admin-field">
              Ban reason
              <textarea
                maxLength={1000}
                minLength={1}
                onChange={(event) => setReason(event.target.value)}
                required
                value={reason}
              />
            </label>
          )}
        </ConfirmationDialog>
      )}
    </div>
  );
}

export function AdminReportActions({ report }: { report: AdminReport }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"reviewed" | "dismissed" | "actioned">(
    report.status === "open" ? "actioned" : report.status,
  );
  const [resolutionNote, setResolutionNote] = useState(report.resolutionNote ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await mutate(`/api/admin/reports/${report.id}/resolve`, "PATCH", { status, resolutionNote });
      setOpen(false);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The report could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        className="admin-secondary-button"
        onClick={() => {
          setError("");
          setStatus(report.status === "open" ? "actioned" : report.status);
          setResolutionNote(report.resolutionNote ?? "");
          setOpen(true);
        }}
        type="button"
      >
        {report.status === "open" ? "Resolve report" : "Edit resolution"}
      </button>
      {open && (
        <ConfirmationDialog
          actionLabel="Save resolution"
          busy={busy}
          description={`Update report #${report.id} about ${report.targetType} #${report.targetId}.`}
          error={error}
          onCancel={() => setOpen(false)}
          onConfirm={submit}
          title="Resolve this report"
        >
          <label className="admin-field">
            Resolution
            <select
              onChange={(event) => setStatus(event.target.value as typeof status)}
              value={status}
            >
              <option value="reviewed">Reviewed · needs follow-up</option>
              <option value="actioned">Actioned · action taken</option>
              <option value="dismissed">Dismissed · no action</option>
            </select>
          </label>
          <label className="admin-field">
            Resolution note{" "}
            <span className="admin-field-optional">Optional · max 1,000 characters</span>
            <textarea
              maxLength={1000}
              onChange={(event) => setResolutionNote(event.target.value)}
              value={resolutionNote}
            />
          </label>
        </ConfirmationDialog>
      )}
    </div>
  );
}

export function AdminBookingActions({ booking }: { booking: AdminBooking }) {
  const router = useRouter();
  const [action, setAction] = useState<"cancel" | "complete" | "refund" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const endpoints = {
    cancel: {
      path: `/api/admin/bookings/${booking.id}/cancel`,
      method: "PATCH" as const,
      title: "Cancel this booking?",
      label: "Cancel booking",
      description:
        "This changes the booking status to cancelled. If it has already been paid, the backend automatically requests a full refund from the payment provider.",
    },
    complete: {
      path: `/api/admin/bookings/${booking.id}/complete`,
      method: "PATCH" as const,
      title: "Complete this booking?",
      label: "Mark completed",
      description: "The backend only completes confirmed bookings after their scheduled end time.",
    },
    refund: {
      path: `/api/admin/bookings/${booking.id}/refund`,
      method: "POST" as const,
      title: "Initiate a refund?",
      label: "Initiate refund",
      description:
        "This requests a full refund only when payment is currently paid. Refunds cannot be reversed; the payment provider completes the refund asynchronously.",
    },
  };

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!action) return;
    setBusy(true);
    setError("");
    try {
      await mutate(endpoints[action].path, endpoints[action].method);
      setMessage(
        action === "refund"
          ? "Refund initiated"
          : `Booking ${action === "cancel" ? "cancelled" : "completed"}`,
      );
      setAction(null);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "The booking action could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="admin-row-actions">
        {(booking.status === "pending" || booking.status === "confirmed") && (
          <button
            className="admin-text-button admin-text-danger"
            onClick={() => {
              setError("");
              setAction("cancel");
            }}
            type="button"
          >
            Cancel
          </button>
        )}
        {booking.status === "confirmed" && (
          <button
            className="admin-text-button"
            onClick={() => {
              setError("");
              setAction("complete");
            }}
            type="button"
          >
            Complete
          </button>
        )}
        {(booking.status === "confirmed" || booking.status === "completed") && (
          <button
            className="admin-text-button"
            onClick={() => {
              setError("");
              setAction("refund");
            }}
            type="button"
          >
            Refund
          </button>
        )}
        {booking.status === "cancelled" && (
          <span className="admin-table-secondary">No actions</span>
        )}
      </div>
      {error && (
        <p className="admin-inline-error" role="alert">
          {error}
        </p>
      )}
      {message && !error && (
        <p className="admin-inline-success" role="status">
          {message}
        </p>
      )}
      {action && (
        <ConfirmationDialog
          actionLabel={endpoints[action].label}
          busy={busy}
          danger={action !== "complete"}
          description={endpoints[action].description}
          error={error}
          onCancel={() => setAction(null)}
          onConfirm={submit}
          title={endpoints[action].title}
        />
      )}
    </div>
  );
}
