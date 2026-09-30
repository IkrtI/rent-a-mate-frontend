import { AuthenticatedShell } from "@/modules/session/components/authenticated-shell";

export default function PrivateLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AuthenticatedShell>{children}</AuthenticatedShell>;
}
