import type { BookingStatus } from "../schemas";

const styles: Record<BookingStatus, string> = {
  pending: "bg-amber-50 text-amber-800",
  confirmed: "bg-emerald-50 text-emerald-800",
  completed: "bg-violet-50 text-violet-800",
  cancelled: "bg-neutral-100 text-neutral-600",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}
