"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarClock,
  ChartNoAxesCombined,
  Flag,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";
import { logout as endSession } from "@/modules/session/client";

type AdminIdentity = { id: number; name: string; email: string; role: "admin" };

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: UsersRound },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarClock },
  { href: "/admin/reports", label: "Reports", icon: Flag },
];

export function AdminShell({ user, children }: { user: AdminIdentity; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const currentPage = navItems.find((item) => item.href === pathname) ?? navItems[0];

  async function logout() {
    setLoggingOut(true);
    try {
      await endSession();
    } finally {
      router.replace("/login?returnTo=%2Fadmin");
      router.refresh();
    }
  }

  return (
    <div className="admin-shell">
      <aside
        aria-label="Admin navigation"
        className={menuOpen ? "admin-sidebar is-open" : "admin-sidebar"}
      >
        <Link aria-label="matefor admin overview" className="admin-brand" href="/admin">
          <span className="admin-brand-mark">m</span>
          <span className="admin-brand-copy">
            <strong>matefor</strong>
            <small>ADMIN CONSOLE</small>
          </span>
        </Link>
        <div className="admin-nav-label">WORKSPACE</div>
        <nav className="admin-nav">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={active ? "admin-nav-link is-active" : "admin-nav-link"}
                href={href}
                key={href}
                onClick={() => setMenuOpen(false)}
              >
                <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="admin-sidebar-foot">
          <div className="admin-sidebar-foot-icon">
            <ShieldCheck aria-hidden="true" size={18} />
          </div>
          <p>
            <strong>Protected workspace</strong>
            <span>Admin access is checked on every request.</span>
          </p>
        </div>
      </aside>

      {menuOpen && (
        <button
          aria-label="Close navigation menu"
          className="admin-sidebar-scrim"
          onClick={() => setMenuOpen(false)}
          type="button"
        />
      )}

      <div className="admin-workspace">
        <header className="admin-topbar">
          <button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            className="admin-mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="admin-topbar-title">
            <p>Operations</p>
            <h1>{currentPage.label}</h1>
          </div>
          <div className="admin-topbar-actions">
            <div className="admin-live-indicator">
              <span /> Admin session
            </div>
            <div className="admin-profile-chip">
              <span className="admin-avatar">{user.name.slice(0, 1).toUpperCase()}</span>
              <span className="admin-profile-copy">
                <strong>{user.name}</strong>
                <small>Administrator</small>
              </span>
            </div>
            <button
              aria-label="Sign out"
              className="admin-icon-button"
              disabled={loggingOut}
              onClick={() => void logout()}
              title="Sign out"
              type="button"
            >
              <LogOut aria-hidden="true" size={18} />
            </button>
          </div>
        </header>
        <main className="admin-main" id="admin-main">
          {children}
        </main>
        <footer className="admin-footer">
          <span>matefor operations</span>
          <span>
            <ChartNoAxesCombined aria-hidden="true" size={13} /> Data from the admin API
          </span>
        </footer>
      </div>
    </div>
  );
}
