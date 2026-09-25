"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getSession, logout } from "@/modules/session/client";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function PublicHeaderActions({ links }: { links: { href: string; label: string }[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useQuery({
    queryKey: ["session"],
    queryFn: getSession,
    retry: false,
    staleTime: 30_000,
  });

  const handleLogout = async () => {
    await logout().catch(() => undefined);
    queryClient.clear();
    router.replace("/");
    router.refresh();
  };

  return (
    <>
      <ThemeToggle className="desktop-theme-toggle" />
      {session.isSuccess ? (
        <>
          <Link className="login-link" href="/dashboard">
            My account
          </Link>
          <button className="button button-small" onClick={handleLogout} type="button">
            Log out
          </button>
        </>
      ) : (
        <>
          <Link className="login-link" href="/login">
            Log in
          </Link>
          <Link className="button button-small" href="/signup">
            Sign up
          </Link>
        </>
      )}
      <details className="mobile-menu">
        <summary aria-label="Open navigation menu">
          <span />
          <span />
        </summary>
        <nav aria-label="Mobile navigation">
          {links.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
          {session.isSuccess ? (
            <>
              <Link href="/dashboard">My account</Link>
              <button onClick={handleLogout} type="button">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <Link href="/signup">Sign up</Link>
            </>
          )}
          <div className="mobile-menu-theme">
            <span>Appearance</span>
            <ThemeToggle className="mobile-theme-toggle" />
          </div>
        </nav>
      </details>
    </>
  );
}
