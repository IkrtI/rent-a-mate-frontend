"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Clock3,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";
import { NotificationPanel } from "@/modules/notification/components/notification-panel";
import { ThemeToggle } from "@/components/theme/theme-toggle";

import { getSession, logout } from "../client";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/messages", label: "Messages", icon: MessageCircle },
];

export function AuthenticatedShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const session = useQuery({ queryKey: ["session"], queryFn: getSession, retry: false });

  useEffect(() => {
    if (session.isError) {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router, session.isError]);

  if (session.isPending) {
    return (
      <main className="account-loading grid min-h-screen place-items-center" aria-busy="true">
        <p className="text-sm text-neutral-600">Loading your account...</p>
      </main>
    );
  }

  if (session.isError) {
    return (
      <main className="account-loading grid min-h-screen place-items-center">
        <p className="text-sm text-neutral-600">Taking you to sign in...</p>
      </main>
    );
  }

  const user = session.data.user;
  const visibleNavigation =
    user.role === "mate"
      ? [
          ...navigation,
          { href: "/mate/profile", label: "Mate profile", icon: UserRound },
          { href: "/mate/photos", label: "Photos", icon: UserRound },
          { href: "/mate/availability", label: "Availability", icon: Clock3 },
        ]
      : navigation;
  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      queryClient.clear();
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <div className="authenticated-shell min-h-screen">
      <header className="authenticated-header sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-5 px-4 sm:px-6">
          <Link className="mr-auto text-sm font-extrabold" href="/dashboard">
            <span className="mr-2 inline-block size-3 rounded-full bg-[#ff5c67]" />
            mateflow.
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Private navigation">
            {visibleNavigation.map(({ href, label, icon: Icon }) => (
              <Link
                className={cn(
                  "authenticated-nav-link inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold",
                  pathname.startsWith(href) && "is-active",
                )}
                href={href}
                key={href}
              >
                <Icon aria-hidden size={16} /> {label}
              </Link>
            ))}
          </nav>
          <button
            className="account-icon-button grid size-9 place-items-center rounded-full"
            onClick={() => setNotificationsOpen(true)}
            title="Notifications"
            type="button"
          >
            <Bell aria-hidden size={18} />
          </button>
          <ThemeToggle />
          <div className="hidden items-center gap-2 sm:flex">
            <span className="grid size-8 place-items-center rounded-full bg-[#23212b] text-white">
              <UserRound aria-hidden size={16} />
            </span>
            <span className="max-w-32 truncate text-sm font-semibold">{user.name}</span>
          </div>
          <button
            className="account-icon-button grid size-9 place-items-center rounded-full"
            onClick={handleLogout}
            title="Sign out"
            type="button"
          >
            <LogOut aria-hidden size={17} />
          </button>
        </div>
      </header>
      <div className="account-page mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</div>
      <nav
        className={`account-mobile-nav fixed inset-x-0 bottom-0 z-30 grid ${user.role === "mate" ? "grid-cols-6" : "grid-cols-3"} border-t md:hidden`}
        aria-label="Mobile navigation"
      >
        {visibleNavigation.map(({ href, label, icon: Icon }) => (
          <Link
            className={`account-mobile-link grid min-h-16 place-items-center gap-1 py-2 text-xs font-semibold ${pathname.startsWith(href) ? "is-active" : ""}`}
            href={href}
            key={href}
          >
            <Icon aria-hidden size={18} /> {label}
          </Link>
        ))}
      </nav>
      <NotificationPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </div>
  );
}
