import Link from "next/link";

import { PhotosEditor } from "@/modules/mate-profile/management-panels";
import { getMateEditorData } from "@/modules/mate-profile/server-data";

export const metadata = { title: "Mate photos | mateflow." };

export default async function MatePhotosPage() {
  const { mate } = await getMateEditorData();
  return (
    <main className="grid gap-6">
      <header>
        <p className="text-sm font-semibold tracking-wide text-rose-600 uppercase">Mate tools</p>
        <h1 className="text-3xl font-bold">Profile photos</h1>
        <Link className="mt-3 inline-block text-sm font-semibold underline" href="/mate/profile">
          Back to profile
        </Link>
      </header>
      {mate ? (
        <PhotosEditor mate={mate} />
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
