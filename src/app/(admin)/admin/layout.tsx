import { Suspense } from "react";
import type { Metadata } from "next";

import "./admin.css";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminPage } from "@/modules/admin/server";

export const metadata: Metadata = {
  title: { default: "Admin Console", template: "%s | matefor Admin" },
  robots: { index: false, follow: false },
};

function AdminAccessLoading() {
  return (
    <main aria-live="polite" className="admin-access-loading">
      <span aria-hidden="true" className="admin-brand-mark">
        m
      </span>
      <p className="admin-overline">SECURE ADMIN WORKSPACE</p>
      <p>Checking administrator access…</p>
    </main>
  );
}

async function ProtectedAdminWorkspace({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user } = await requireAdminPage();
  return <AdminShell user={user}>{children}</AdminShell>;
}

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense fallback={<AdminAccessLoading />}>
      <ProtectedAdminWorkspace>{children}</ProtectedAdminWorkspace>
    </Suspense>
  );
}
