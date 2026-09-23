import Link from "next/link";

export function AuthFrame({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="grid min-h-screen bg-[#fffaf8] lg:grid-cols-[minmax(0,1.2fr)_minmax(420px,0.8fr)]">
      <section
        className="relative hidden min-h-screen overflow-hidden bg-[#22202a] px-10 py-8 text-white lg:flex lg:flex-col"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(34,32,42,.3), rgba(34,32,42,.88)), url('https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1600&q=85')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <Link className="relative z-10 text-sm font-extrabold tracking-normal" href="/">
          <span className="mr-2 inline-block size-3 rounded-full bg-[#ff5c67]" />
          mateflow.
        </Link>
        <div className="relative z-10 mt-auto max-w-xl pb-10">
          <p className="mb-4 font-mono text-xs text-[#ff8991] uppercase">Meet. Plan. Remember.</p>
          <h1 className="font-[family-name:var(--font-display)] text-5xl leading-[0.98] tracking-normal xl:text-7xl">
            Plans are better
            <br />
            with good company.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-white/75">
            Find someone who fits the moment, agree on the details, and keep every plan clear.
          </p>
        </div>
      </section>
      <section className="flex min-h-screen flex-col px-6 py-6 sm:px-10 lg:px-14">
        <div className="flex items-center justify-between lg:justify-end">
          <Link className="text-sm font-extrabold lg:hidden" href="/">
            <span className="mr-2 inline-block size-3 rounded-full bg-[#ff5c67]" />
            mateflow.
          </Link>
          <Link className="text-sm text-neutral-600 hover:text-neutral-950" href="/">
            Back to home
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 items-center py-12">{children}</div>
      </section>
    </main>
  );
}
