"use client";

import { useEffect } from "react";
import Link from "next/link";

import "./admin/admin.css";

export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Admin workspace failed to render", error.digest ?? error.name);
  }, [error]);

  return (
    <main aria-labelledby="admin-fatal-error-title" className="admin-fatal-error">
      <span aria-hidden="true" className="admin-brand-mark">
        m
      </span>
      <p className="admin-overline">ADMIN WORKSPACE</p>
      <h1 id="admin-fatal-error-title">We couldn’t load this workspace.</h1>
      <p>Your session or the admin service may be unavailable. Try again, or sign in again.</p>
      <div className="admin-dialog-actions">
        <button className="admin-primary-button" onClick={retry} type="button">
          Try again
        </button>
        <Link className="admin-secondary-button" href="/login?returnTo=%2Fadmin">
          Admin sign in
        </Link>
      </div>
    </main>
  );
}
