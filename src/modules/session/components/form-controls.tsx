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
    <div className="text-foreground grid gap-2 text-sm font-semibold">
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <span className="text-destructive text-xs font-medium" id={`${id}-error`} role="alert">
          {error}
        </span>
      ) : null}
      {hint && !error ? (
        <span className="text-muted-foreground text-xs font-normal" id={`${id}-hint`}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export const inputClassName = cn(
  "h-11 w-full rounded-md border border-input bg-card px-3 text-sm text-card-foreground outline-none",
  "placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/20",
  "aria-invalid:border-destructive aria-invalid:focus:border-destructive aria-invalid:focus:ring-destructive/20",
);

export const primaryButtonClassName = cn(
  "inline-flex h-11 w-full items-center justify-center rounded-md bg-[#ff5c67] px-4 text-sm font-bold text-[#20212a] dark:text-[#17171b]",
  "transition-colors hover:bg-[#ea4c58] focus:outline-none focus:ring-2 focus:ring-[#ff5c67] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
);
