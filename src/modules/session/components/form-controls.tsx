import { cn } from "@/lib/cn";

export function Field({
  id,
  label,
  error,
  hint,
  children,
}: Readonly<{
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}>) {
  return (
    <div className="grid gap-2 text-sm font-semibold text-neutral-800">
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <span className="text-xs font-medium text-red-600" id={`${id}-error`} role="alert">
          {error}
        </span>
      ) : null}
      {hint && !error ? (
        <span className="text-xs font-normal text-neutral-600" id={`${id}-hint`}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export const inputClassName = cn(
  "h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none",
  "placeholder:text-neutral-400 focus:border-[#ff5c67] focus:ring-2 focus:ring-[#ff5c67]/20",
  "aria-invalid:border-red-500 aria-invalid:focus:border-red-500 aria-invalid:focus:ring-red-500/20",
);

export const primaryButtonClassName = cn(
  "inline-flex h-11 w-full items-center justify-center rounded-md bg-[#ff5c67] px-4 text-sm font-bold text-white",
  "transition-colors hover:bg-[#ea4c58] focus:outline-none focus:ring-2 focus:ring-[#ff5c67] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
);
