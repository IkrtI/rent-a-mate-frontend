import type { Metadata } from "next";

import "../../../(admin)/admin/admin.css";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ reason?: string }> };

export default async function AdminLoginPage({ searchParams }: Props) {
  const { reason } = await searchParams;
  return (
    <main className="admin-login-shell">
      <section className="admin-login-brand-panel">
        <div className="admin-login-brand">
          <span className="admin-brand-mark">m</span>
          <span>
            <strong>matefor</strong>
            <small>ADMIN CONSOLE</small>
          </span>
        </div>
        <div className="admin-login-brand-message">
          <p className="admin-overline">OPERATIONS · BANGKOK</p>
          <h1>Make every decision count.</h1>
          <p>Manage trust, activity, and the people behind every good plan.</p>
        </div>
        <p className="admin-login-brand-foot">
          A safer marketplace starts with thoughtful operations.
        </p>
      </section>
      <section aria-labelledby="admin-login-title" className="admin-login-form-panel">
        <div className="admin-login-card">
          <p className="admin-overline">SECURE ADMIN ACCESS</p>
          <h2 id="admin-login-title">Welcome back.</h2>
          <p className="admin-login-intro">Sign in with an administrator account to continue.</p>
          {reason === "forbidden" && (
            <p className="admin-form-alert" role="alert">
              This account does not have administrator access.
            </p>
          )}
          <AdminLoginForm />
          <p className="admin-login-security">
            Access is verified for every admin action. Your credentials stay protected in secure,
            HttpOnly session cookies.
          </p>
        </div>
      </section>
    </main>
  );
}
