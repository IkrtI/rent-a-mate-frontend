import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ reason?: string }> };

export default async function AdminLoginPage({ searchParams }: Props) {
  const { reason } = await searchParams;
  const params = new URLSearchParams({ returnTo: "/admin" });
  if (reason === "forbidden") params.set("reason", "forbidden");
  redirect(`/login?${params.toString()}`);
}
