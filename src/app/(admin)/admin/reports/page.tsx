import Link from "next/link";
import { Flag } from "lucide-react";

import {
  AdminPagination,
  AdminPageHeading,
  formatAdminDate,
  StatusBadge,
} from "@/components/admin/admin-ui";
import { AdminReportActions } from "@/components/admin/admin-mutations";
import { AdminErrorState } from "@/components/admin/admin-states";
import { getAdminReports } from "@/modules/admin/server";

type SearchParams = Record<string, string | string[] | undefined>;
function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const search = await searchParams;
  const requestedStatus = first(search.status) ?? "open";
  const status = ["open", "reviewed", "dismissed", "actioned"].includes(requestedStatus)
    ? requestedStatus
    : "open";
  const page = Math.max(1, Math.min(10000, Number(first(search.page)) || 1));
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  params.set("status", status);
  const query = params.toString();
  const result = await getAdminReports(query)
    .then((data) => ({ data, error: false as const }))
    .catch(() => ({ data: null, error: true as const }));
  const total = result.data?.meta.total ?? 0;
  const filters = { status, page: String(page) };

  return (
    <div className="admin-page">
      <AdminPageHeading
        description="Review reports on accounts and marketplace activity. Record what happened so the next admin has clear context."
        eyebrow="TRUST & SAFETY"
        title="Report review queue"
        action={
          <Link className="admin-secondary-button" href="/admin/reports?status=open">
            <Flag size={15} /> Open reports
          </Link>
        }
      />
      <section aria-label="Filter reports" className="admin-panel admin-filter-panel">
        <form action="/admin/reports" className="admin-filter-form">
          <label className="admin-field">
            Report status
            <select defaultValue={status} name="status">
              <option value="open">Open</option>
              <option value="reviewed">Reviewed</option>
              <option value="dismissed">Dismissed</option>
              <option value="actioned">Actioned</option>
            </select>
          </label>
          <button className="admin-primary-button" type="submit">
            Apply filter
          </button>
          <Link className="admin-filter-clear" href="/admin/reports">
            Reset
          </Link>
        </form>
      </section>
      <section aria-label="Reports" className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h3>Member reports</h3>
            <p>
              {result.data ? `${total.toLocaleString()} ${status} reports` : "Report queue status"}
            </p>
          </div>
          <StatusBadge status={result.error ? "unavailable" : status} />
        </div>
        {result.error ? (
          <AdminErrorState
            message="Reports could not be loaded. Your filter is saved; try again."
            retryHref={`/admin/reports?${query}`}
          />
        ) : result.data?.items.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table admin-reports-table">
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Reported by</th>
                  <th>Target</th>
                  <th>Reason</th>
                  <th>Reported</th>
                  <th>Resolution</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {result.data.items.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <span className="admin-table-primary">#{report.id}</span>
                    </td>
                    <td>
                      {report.reporter.name}
                      <span className="admin-table-secondary admin-block">
                        Member {report.reporterId}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={report.targetType} />
                      <span className="admin-table-secondary admin-block">
                        ID {report.targetId}
                      </span>
                    </td>
                    <td className="admin-report-reason">{report.reason}</td>
                    <td>{formatAdminDate(report.createdAt)}</td>
                    <td className="admin-resolution-cell">
                      {report.resolutionNote || (
                        <span className="admin-table-secondary">No note</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="admin-actions-cell">
                      <AdminReportActions report={report} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty-state">
            <span className="admin-empty-state-icon">
              <Flag size={18} />
            </span>
            <h3>No {status} reports</h3>
            <p>This queue is clear. Switch status to review closed reports.</p>
            <Link className="admin-secondary-button" href="/admin/reports?status=open">
              View open reports
            </Link>
          </div>
        )}
        {result.data && (
          <AdminPagination
            basePath="/admin/reports"
            page={result.data.meta.page}
            search={filters}
            total={result.data.meta.total}
            totalPages={result.data.meta.totalPages}
          />
        )}
      </section>
    </div>
  );
}
