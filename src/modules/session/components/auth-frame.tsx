import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function AuthFrame({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="auth-frame grid min-h-screen lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)]">
      <section className="auth-frame-aside hidden min-h-screen px-12 py-10 lg:flex lg:flex-col">
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
        <div className="auth-frame-copy max-w-lg border-t pt-6 pb-8">
          <p className="text-sm font-medium tracking-tight">You don&apos;t have to go alone.</p>
          <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight xl:text-4xl">
            Some days, you just need someone there.
          </h1>
          <p className="auth-frame-description mt-4 max-w-md text-sm leading-6">
            From a quiet coffee to a night out, find a mate who&apos;s there when you want a little
            company.
          </p>
        </div>
      </section>
      <section className="auth-frame-form flex min-h-screen flex-col px-6 py-6 sm:px-10 lg:px-14">
        <div className="flex items-center justify-between gap-4 lg:justify-end">
          <Link className="text-sm font-bold tracking-tight lg:hidden" href="/">
            <span className="mr-2 inline-block size-3 rounded-full bg-[#ff5c67]" />
            mateflow.
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link className="auth-back-link text-sm" href="/">
              Back to home
            </Link>
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 items-center py-12">{children}</div>
      </section>
    </main>
  );
}
