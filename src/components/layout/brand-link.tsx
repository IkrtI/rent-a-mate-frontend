import Link from "next/link";

import { cn } from "@/lib/cn";

export function BrandLink({ className }: Readonly<{ className?: string }>) {
  return (
    <Link aria-label="mateflow home" className={cn("brand", className)} href="/">
      <span aria-hidden="true" className="brand-mark" />
      <span>mateflow.</span>
    </Link>
  );
}
