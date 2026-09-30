import Link from "next/link";

import { AvailabilityEditor } from "@/modules/mate-profile/management-panels";
import { getMateEditorData } from "@/modules/mate-profile/server-data";

export const metadata = {
  title: "Mate availability | mateflow.",
  robots: { index: false, follow: false },
};

export default async function MateAvailabilityPage() {
  const { mate, loadError } = await getMateEditorData();
  return (
    <main className="grid gap-6">
      <header>
        <h1 className="text-3xl font-bold">Weekly availability</h1>
        <Link className="mt-3 inline-block text-sm font-semibold underline" href="/profile#mate">
          Back to profile
        </Link>
      </header>
      {loadError ? (
        <section className="bg-card text-card-foreground rounded-2xl p-6" role="alert">
          <h2 className="text-xl font-semibold">We couldn’t load your Mate profile.</h2>
          <Link className="mt-3 inline-block underline" href="/mate/availability">
            Retry
          </Link>
        </section>
      ) : mate ? (
        <AvailabilityEditor mate={mate} />
      ) : (
        <section className="bg-card text-card-foreground rounded-2xl p-6">
          <h2 className="text-xl font-semibold">Create your Mate profile first</h2>
          <Link className="mt-3 inline-block underline" href="/profile#mate">
            Set up profile
          </Link>
        </section>
      )}
    </main>
  );
}
