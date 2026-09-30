import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export function AdminPageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="admin-page-heading">
      <div className="admin-page-heading-copy">
        <p className="admin-overline">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

export function AdminMetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="admin-metric">
      <div className="admin-metric-top">
        <span className="admin-metric-label">{label}</span>
        <span className="admin-metric-icon">
          <Icon aria-hidden="true" size={16} />
        </span>
      </div>
      <div className="admin-metric-value">{value}</div>
      <div className="admin-metric-hint">{hint}</div>
    </article>
  );
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const style =
    status === "completed" || status === "actioned" || status === "active" || status === "paid"
      ? "success"
      : status === "pending" || status === "open" || status === "reviewed" || status === "refunding"
        ? "warning"
        : status === "cancelled" ||
            status === "dismissed" ||
            status === "banned" ||
            status === "inactive"
          ? "danger"
          : status === "confirmed" || status === "verified"
            ? "info"
            : "default";
  return <span className={`admin-badge ${style}`}>{label ?? status}</span>;
}

export function AdminPagination({
  page,
  totalPages,
  total,
  basePath,
  search,
}: {
  page: number;
  totalPages: number;
  total: number;
  basePath: string;
  search: Record<string, string | string[] | undefined>;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (key === "page" || value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) params.append(key, item);
  }
  const hrefFor = (nextPage: number) => {
    const next = new URLSearchParams(params);
    next.set("page", String(nextPage));
    return `${basePath}?${next.toString()}`;
  };

  return (
    <div aria-label="Pagination" className="admin-pagination">
      <span>
        Page {page} of {Math.max(1, totalPages)} · {total.toLocaleString()} records
      </span>
      <div className="admin-pagination-controls">
        {page > 1 ? (
          <Link className="admin-secondary-button" href={hrefFor(page - 1)}>
            <ArrowLeft aria-hidden="true" size={14} /> Previous
          </Link>
        ) : (
          <button className="admin-secondary-button" disabled type="button">
            <ArrowLeft aria-hidden="true" size={14} /> Previous
          </button>
        )}
        {page < totalPages ? (
          <Link className="admin-secondary-button" href={hrefFor(page + 1)}>
            Next <ArrowRight aria-hidden="true" size={14} />
          </Link>
        ) : (
          <button className="admin-secondary-button" disabled type="button">
            Next <ArrowRight aria-hidden="true" size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export function formatAdminDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatAdminTime(value: string) {
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatAdminMoney(value: string | number) {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return `฿${value}`;
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(amount);
}
