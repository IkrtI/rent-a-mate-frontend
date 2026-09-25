import type { Metadata } from "next";

import { SignupForm } from "@/modules/session/components/signup-form";

export const metadata: Metadata = { title: "Create account | Rent a Mate" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string | string[] }>;
}) {
  const requestedRole = (await searchParams).role;
  const initialRole = requestedRole === "mate" ? "mate" : "renter";

  return <SignupForm initialRole={initialRole} />;
}
