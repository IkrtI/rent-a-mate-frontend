import Link from "next/link";

import { AvailabilityEditor } from "@/modules/mate-profile/management-panels";
import { getMateEditorData } from "@/modules/mate-profile/server-data";

export const metadata = { title: "Mate availability | mateflow." };

export default async function MateAvailabilityPage() {
  const { mate } = await getMateEditorData();
  return (
    <main className="grid gap-6">
      <header>
        <p className="text-sm font-semibold tracking-wide text-rose-600 uppercase">Mate tools</p>
        <h1 className="text-3xl font-bold">Weekly availability</h1>
        <Link className="mt-3 inline-block text-sm font-semibold underline" href="/mate/profile">
          Back to profile
        </Link>
      </header>
      {mate ? (
        <AvailabilityEditor mate={mate} />
      ) : (
        <section className="rounded-2xl bg-white p-6">
          <h2 className="text-xl font-semibold">Create your Mate profile first</h2>
          <Link className="mt-3 inline-block underline" href="/mate/profile">
            Set up profile
          </Link>
        </section>
      )}
    </main>
  );
}
