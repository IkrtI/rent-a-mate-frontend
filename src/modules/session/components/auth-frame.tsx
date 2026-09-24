import Link from "next/link";
import Image from "next/image";

export function AuthFrame({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="grid min-h-screen bg-[#fffdfa] lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)]">
      <section className="hidden min-h-screen bg-[#f3f3f0] px-12 py-10 text-neutral-950 lg:flex lg:flex-col">
        <Link className="text-sm font-bold tracking-tight" href="/">
          <span className="mr-2 inline-block size-2 rounded-full bg-[#ff5c67]" />
          mateflow.
        </Link>
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center pt-8">
          <Image
            alt="Two people meeting"
            className="mx-auto w-full max-w-md mix-blend-multiply"
            height={800}
            priority
            src="/pictures/auth-companions.png"
            width={800}
          />
        </div>
        <div className="max-w-lg border-t border-neutral-300 pt-6 pb-8">
          <p className="text-sm font-medium tracking-tight text-neutral-700">
            You don&apos;t have to go alone.
          </p>
          <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight xl:text-4xl">
            Some days, you just need someone there.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-neutral-600">
            From a quiet coffee to a night out, find a mate who&apos;s there when you want a little
            company.
          </p>
        </div>
      </section>
      <section className="flex min-h-screen flex-col px-6 py-6 sm:px-10 lg:px-14">
        <div className="flex items-center justify-between lg:justify-end">
          <Link className="text-sm font-bold tracking-tight lg:hidden" href="/">
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
