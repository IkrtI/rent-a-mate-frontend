import Link from "next/link";
import { CalendarClock, Images } from "lucide-react";

import { ProfileEditor } from "@/modules/mate-profile/management-panels";
import { getMateEditorData } from "@/modules/mate-profile/server-data";

export const metadata = {
  title: "Mate profile | mateflow.",
  robots: { index: false, follow: false },
};

export default async function MateProfilePage() {
  const data = await getMateEditorData();
  return (
    <main className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-wide text-rose-600 uppercase">Mate tools</p>
          <h1 className="text-3xl font-bold">Your profile</h1>
          <p className="mt-2 text-neutral-600">
            Keep your public profile and activity details up to date.
          </p>
        </div>
        <nav
          aria-label="Mate profile sections"
          className="flex flex-wrap gap-3 text-sm font-semibold"
        >
          <Link
            className="border-border bg-card text-card-foreground hover:border-primary hover:bg-accent inline-flex h-10 items-center gap-2 rounded-md border px-4 shadow-sm transition-colors"
            href="/mate/photos"
          >
            <Images aria-hidden size={17} /> Photos
          </Link>
          <Link
            className="border-border bg-card text-card-foreground hover:border-primary hover:bg-accent inline-flex h-10 items-center gap-2 rounded-md border px-4 shadow-sm transition-colors"
            href="/mate/availability"
          >
            <CalendarClock aria-hidden size={17} /> Availability
          </Link>
        </nav>
      </header>
      {data.loadError ? (
        <section className="rounded-2xl border border-red-200 bg-white p-6" role="alert">
          <h2 className="font-semibold">We couldn’t load your Mate profile.</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Try again to check your saved profile and lookup options.
          </p>
          <Link className="mt-3 inline-block font-semibold underline" href="/mate/profile">
            Retry
          </Link>
        </section>
      ) : (
        <ProfileEditor {...data} />
      )}
    </main>
  );
}
