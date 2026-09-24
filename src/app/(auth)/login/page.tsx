import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/modules/session/components/login-form";

export const metadata: Metadata = { title: "Sign in | Rent a Mate" };

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-600">Loading sign in...</p>}>
      <LoginForm />
    </Suspense>
  );
}
