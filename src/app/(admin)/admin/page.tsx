import Link from "next/link";
import { Activity, ArrowUpRight, CircleDollarSign, Clock3, Flag, UsersRound } from "lucide-react";

import { AdminAnalyticsChart } from "@/components/admin/admin-analytics-chart";
import { AdminMetricCard, AdminPageHeading, StatusBadge } from "@/components/admin/admin-ui";
import { getAdminAnalytics, getAdminReports } from "@/modules/admin/server";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatRevenue(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function AdminOverviewPage({ searchParams }: Props) {
  const search = await searchParams;
  const from = first(search.from) ?? "";
  const to = first(search.to) ?? "";
  const query = new URLSearchParams();
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  const [analyticsResult, reportsResult] = await Promise.allSettled([
    getAdminAnalytics(query.toString()),
    getAdminReports("status=open&limit=1"),
  ]);
  const analytics = analyticsResult.status === "fulfilled" ? analyticsResult.value : null;
  const openReports = reportsResult.status === "fulfilled" ? reportsResult.value.meta.total : null;
  const counts = analytics?.bookingCounts;
  const totalBookings = counts
    ? counts.pending + counts.confirmed + counts.completed + counts.cancelled
    : 0;
  const maxCount = counts ? Math.max(1, ...Object.values(counts)) : 1;

  return (
    <div className="admin-page">
      <AdminPageHeading
        action={
          <form action="/admin" className="admin-date-range">
            <label className="admin-field">
              From
              <input
                aria-label="Analytics start date"
                defaultValue={analytics?.range.from ?? from}
                name="from"
                type="date"
              />
            </label>
            <label className="admin-field">
              To
              <input
                aria-label="Analytics end date"
                defaultValue={analytics?.range.to ?? to}
                name="to"
                type="date"
              />
            </label>
            <button className="admin-primary-button" type="submit">
              Apply range
            </button>
          </form>
        }
        description="Marketplace health, booking activity, and trust operations in one workspace."
        eyebrow="ADMIN CONTROL CENTER"
        title="Good morning. Here’s the pulse of matefor."
      />

      {!analytics && (
        <div className="admin-error-state" role="status">
          Analytics could not be loaded. Check the date range or retry when the backend is
          available.
        </div>
      )}
      <section aria-label="Marketplace key metrics" className="admin-metric-grid">
        <AdminMetricCard
          hint="Across the selected date range"
          icon={Activity}
          label="Total bookings"
          value={analytics ? totalBookings.toLocaleString() : "—"}
        />
        <AdminMetricCard
          hint="Awaiting a Mate response"
          icon={Clock3}
          label="Pending"
          value={analytics?.bookingCounts.pending.toLocaleString() ?? "—"}
        />
        <AdminMetricCard
          hint="Paid bookings in range"
          icon={CircleDollarSign}
          label="Paid revenue"
          value={analytics ? formatRevenue(analytics.paidRevenue) : "—"}
        />
        <AdminMetricCard
          hint="Newly active accounts"
          icon={UsersRound}
          label="New active users"
          value={analytics?.newActiveUsers.toLocaleString() ?? "—"}
        />
      </section>

      <section className="admin-chart-layout">
        <article aria-label="Booking activity" className="admin-panel admin-chart-panel">
          <div className="admin-panel-header">
            <div>
              <h3>Booking activity</h3>
              <p>
                {analytics
                  ? `${analytics.range.from} — ${analytics.range.to} · Bangkok time`
                  : "Analytics unavailable"}
              </p>
            </div>
          </div>
          <div className="admin-panel-body">
            {analytics ? (
              <AdminAnalyticsChart data={analytics.daily} />
            ) : (
              <div className="admin-empty-state">
                <p>Refresh after the admin API is available.</p>
              </div>
            )}
          </div>
        </article>

        <article className="admin-panel admin-status-panel">
          <div className="admin-panel-header">
            <div>
              <h3>Booking status</h3>
              <p>{totalBookings.toLocaleString()} total</p>
            </div>
            <Link aria-label="Open all bookings" className="admin-icon-link" href="/admin/bookings">
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="admin-panel-body">
            {counts ? (
              <div className="admin-status-list">
                {Object.entries(counts).map(([status, value]) => (
                  <div key={status}>
                    <div className="admin-status-row-top">
                      <span>{status}</span>
                      <strong>{value.toLocaleString()}</strong>
                    </div>
                    <div
                      aria-label={`${status}: ${value} bookings`}
                      className="admin-progress-track"
                      role="img"
                    >
                      <div
                        className={`admin-progress-fill ${status}`}
                        style={{ width: `${Math.max(2, (value / maxCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-error-state">Booking status data is unavailable.</div>
            )}
          </div>
        </article>
      </section>

      <section className="admin-ops-row">
        <article className="admin-panel admin-queue-card">
          <div className="admin-queue-icon">
            <Flag aria-hidden="true" size={19} />
          </div>
          <div className="admin-queue-copy">
            <p className="admin-overline">TRUST & SAFETY</p>
            <h3>Reports need your attention</h3>
            <p>Review member reports and record a clear resolution.</p>
          </div>
          <div className="admin-queue-action">
            <StatusBadge
              label={openReports === null ? "Queue unavailable" : `${openReports} open`}
              status={openReports === null ? "unavailable" : "open"}
            />
            <Link className="admin-primary-button" href="/admin/reports?status=open">
              Open queue <ArrowUpRight aria-hidden="true" size={15} />
            </Link>
          </div>
        </article>
        {reportsResult.status === "rejected" && (
          <p className="admin-inline-error" role="status">
            The report queue could not be loaded.
          </p>
        )}
      </section>
    </div>
  );
}
