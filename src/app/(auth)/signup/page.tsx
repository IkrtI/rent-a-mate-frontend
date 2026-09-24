import type { Metadata } from "next";

import { SignupForm } from "@/modules/session/components/signup-form";

export const metadata: Metadata = { title: "Create account | Rent a Mate" };

export default function SignupPage() {
  return <SignupForm />;
}
