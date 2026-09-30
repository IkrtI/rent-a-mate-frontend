import { PublicRouteShell } from "@/components/layout/public-route-shell";

export default function PublicRouteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <PublicRouteShell>{children}</PublicRouteShell>;
}
