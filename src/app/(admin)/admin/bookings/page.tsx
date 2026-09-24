import Link from "next/link";
import { CalendarClock, Search } from "lucide-react";

import {
  AdminPagination,
  AdminPageHeading,
  formatAdminDate,
  formatAdminMoney,
  formatAdminTime,
  StatusBadge,
} from "@/components/admin/admin-ui";
import { AdminBookingActions } from "@/components/admin/admin-mutations";
import { AdminErrorState } from "@/components/admin/admin-states";
import { getAdminBookings } from "@/modules/admin/server";

type SearchParams = Record<string, string | string[] | undefined>;
function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
function dateValue(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value ? value : "";
}
function idValue(value: string) {
  if (!/^\d+$/.test(value)) return "";
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? String(id) : "";
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const search = await searchParams;
  const requestedStatus = first(search.status) ?? "";
  const status = ["pending", "confirmed", "completed", "cancelled"].includes(requestedStatus)
    ? requestedStatus
    : "";
  const exactDate = dateValue(first(search.date) ?? "");
  const dateFrom = dateValue(first(search.dateFrom) ?? "");
  const dateTo = dateValue(first(search.dateTo) ?? "");
  const mateId = idValue(first(search.mateId) ?? "");
  const renterId = idValue(first(search.renterId) ?? "");
  const page = Math.max(1, Math.min(10000, Number(first(search.page)) || 1));
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (status) params.set("status", status);
  if (exactDate) params.set("date", exactDate);
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  if (mateId) params.set("mateId", mateId);
  if (renterId) params.set("renterId", renterId);
  const query = params.toString();
  const result = await getAdminBookings(query)
    .then((data) => ({ data, error: false as const }))
    .catch(() => ({ data: null, error: true as const }));
  const total = result.data?.meta.total ?? 0;
  const filters = {
    status,
    date: exactDate,
    dateFrom,
    dateTo,
    mateId,
    renterId,
    page: String(page),
  };

  return (
    <div className="admin-page">
      <AdminPageHeading
        description="Review marketplace-wide bookings, narrow the queue by status or date, and apply supported state or refund actions."
        eyebrow="MARKETPLACE ACTIVITY"
        title="Booking operations"
      />
      <section className="admin-panel admin-filter-panel" aria-label="Filter bookings">
        <form action="/admin/bookings" className="admin-filter-form">
          <label className="admin-field">
            Status
            <select defaultValue={status} name="status">
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <label className="admin-field">
            Exact date
            <input defaultValue={exactDate} name="date" type="date" />
          </label>
          <label className="admin-field">
            Scheduled from
            <input defaultValue={dateFrom} name="dateFrom" type="date" />
          </label>
          <label className="admin-field">
            Scheduled through
            <input defaultValue={dateTo} name="dateTo" type="date" />
          </label>
          <label className="admin-field">
            Mate ID
            <input
              defaultValue={mateId}
              inputMode="numeric"
              min="1"
              name="mateId"
              pattern="[0-9]*"
              placeholder="Any Mate"
              type="number"
            />
          </label>
          <label className="admin-field">
            Renter ID
            <input
              defaultValue={renterId}
              inputMode="numeric"
              min="1"
              name="renterId"
              pattern="[0-9]*"
              placeholder="Any renter"
              type="number"
            />
          </label>
          <button className="admin-primary-button" type="submit">
            <Search size={15} /> Apply filters
          </button>
          <Link className="admin-filter-clear" href="/admin/bookings">
            Clear filters
          </Link>
        </form>
      </section>
      <section aria-label="Booking results" className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h3>All marketplace bookings</h3>
            <p>
              {result.data
                ? `${total.toLocaleString()} records · newest first`
                : "Booking feed status"}
            </p>
          </div>
          <StatusBadge status={result.error ? "unavailable" : `${total} records`} />
        </div>
        {result.error ? (
          <AdminErrorState
            message="Bookings could not be loaded. Your filters are saved; try again."
            retryHref={`/admin/bookings?${query}`}
          />
        ) : result.data?.items.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Renter</th>
                  <th>Mate</th>
                  <th>Activity</th>
                  <th>Scheduled</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Admin actions</th>
                </tr>
              </thead>
              <tbody>
                {result.data.items.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <span className="admin-table-primary">
                        #{booking.id}
                        <span className="admin-table-secondary">
                          Updated {formatAdminDate(booking.updatedAt)}
                        </span>
                      </span>
                    </td>
                    <td>
                      {booking.renter.name}
                      <span className="admin-table-secondary admin-block">
                        ID {booking.renter.id}
                      </span>
                    </td>
                    <td>
                      {booking.mate.name}
                      <span className="admin-table-secondary admin-block">
                        ID {booking.mate.id}
                      </span>
                    </td>
                    <td>{booking.activity.name}</td>
                    <td>
                      {formatAdminDate(booking.date)}
                      <span className="admin-table-secondary admin-block">
                        {formatAdminTime(booking.startTime)}–{formatAdminTime(booking.endTime)} ICT
                      </span>
                    </td>
                    <td className="admin-amount-cell">{formatAdminMoney(booking.totalPrice)}</td>
                    <td>
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="admin-actions-cell">
                      <AdminBookingActions booking={booking} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty-state">
            <span className="admin-empty-state-icon">
              <CalendarClock size={18} />
            </span>
            <h3>No bookings match these filters</h3>
            <p>Broaden the date range or clear the status filter to see more activity.</p>
          </div>
        )}
        {result.data && (
          <AdminPagination
            basePath="/admin/bookings"
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
