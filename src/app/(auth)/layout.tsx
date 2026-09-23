import { AuthFrame } from "@/modules/session/components/auth-frame";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AuthFrame>{children}</AuthFrame>;
}
