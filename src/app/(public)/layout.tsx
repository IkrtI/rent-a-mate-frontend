import { PublicLayout } from "@/components/layout/public-shell";

export default function PublicRouteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <PublicLayout>{children}</PublicLayout>;
}
