"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";

import { AuthenticatedShell } from "@/modules/session/components/authenticated-shell";
import { getSession } from "@/modules/session/client";

import { PublicLayout } from "./public-shell";

export function PublicRouteShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isMateDiscovery = pathname === "/mates" || pathname.startsWith("/mates/");
  const session = useQuery({
    queryKey: ["session"],
    queryFn: getSession,
    enabled: isMateDiscovery,
    retry: false,
  });

  if (isMateDiscovery && session.isSuccess) {
    return <AuthenticatedShell>{children}</AuthenticatedShell>;
  }

  return <PublicLayout>{children}</PublicLayout>;
}
