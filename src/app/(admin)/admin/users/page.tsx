import Link from "next/link";
import { Search, UsersRound } from "lucide-react";

import {
  AdminPagination,
  AdminPageHeading,
  formatAdminDate,
  StatusBadge,
} from "@/components/admin/admin-ui";
import { AdminUserActions } from "@/components/admin/admin-mutations";
import { AdminErrorState } from "@/components/admin/admin-states";
import { getAdminUsers, requireAdminPage } from "@/modules/admin/server";

type Search = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<Search> }) {
  const search = await searchParams;
  const query = first(search.q)?.trim().slice(0, 100) ?? "";
  const role = first(search.role) ?? "";
  const isBanned = first(search.isBanned) ?? "";
  const isActive = first(search.isActive) ?? "";
  const isVerified = first(search.isVerified) ?? "";
  const page = Math.max(1, Math.min(10000, Number(first(search.page)) || 1));
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (query) params.set("q", query);
  if (["admin", "mate", "renter"].includes(role)) params.set("role", role);
  for (const [key, value] of [
    ["isBanned", isBanned],
    ["isActive", isActive],
    ["isVerified", isVerified],
  ]) {
    if (value === "true" || value === "false") params.set(key, value);
  }
  const queryString = params.toString();
  const [session, result] = await Promise.all([
    requireAdminPage(),
    getAdminUsers(queryString)
      .then((data) => ({ data, error: false as const }))
      .catch(() => ({ data: null, error: true as const })),
  ]);
  const total = result.data?.meta.total ?? 0;
  const currentSearch: Search = {
    q: query,
    role,
    isBanned,
    isActive,
    isVerified,
    page: String(page),
  };

  return (
    <div className="admin-page">
      <AdminPageHeading
        description="Search every account, review access state, verify Mate accounts, and take supported moderation actions."
        eyebrow="MEMBER OPERATIONS"
        title="Users & access"
      />
      <section aria-label="User account metrics" className="admin-metric-grid admin-user-summary">
        <article className="admin-metric">
          <div className="admin-metric-top">
            <span className="admin-metric-label">Accounts in results</span>
            <span className="admin-metric-icon">
              <UsersRound size={16} />
            </span>
          </div>
          <div className="admin-metric-value">{result.data ? total.toLocaleString() : "—"}</div>
          <div className="admin-metric-hint">Based on active filters</div>
        </article>
        <article className="admin-metric admin-metric-context">
          <p className="admin-overline">AVAILABLE CONTROLS</p>
          <p>Ban or restore access · Activate accounts · Verify Mate accounts</p>
        </article>
      </section>

      <section aria-label="Search and filter users" className="admin-panel admin-filter-panel">
        <form action="/admin/users" className="admin-filter-form">
          <label className="admin-field admin-search-field">
            <span>Search name or email</span>
            <Search aria-hidden="true" size={16} />
            <input
              defaultValue={query}
              maxLength={100}
              name="q"
              placeholder="Name or email address"
              type="search"
            />
          </label>
          <label className="admin-field">
            Role
            <select defaultValue={role} name="role">
              <option value="">All roles</option>
              <option value="renter">Renter</option>
              <option value="mate">Mate</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label className="admin-field">
            Account
            <select defaultValue={isActive} name="isActive">
              <option value="">Any state</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>
          <label className="admin-field">
            Access
            <select defaultValue={isBanned} name="isBanned">
              <option value="">Any access</option>
              <option value="false">Not banned</option>
              <option value="true">Banned</option>
            </select>
          </label>
          <label className="admin-field">
            Verification
            <select defaultValue={isVerified} name="isVerified">
              <option value="">Any status</option>
              <option value="true">Verified</option>
              <option value="false">Not verified</option>
            </select>
          </label>
          <button className="admin-primary-button" type="submit">
            <Search size={15} /> Search
          </button>
          <Link className="admin-filter-clear" href="/admin/users">
            Clear filters
          </Link>
        </form>
      </section>

      <section aria-label="User results" className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h3>All accounts</h3>
            <p>
              {result.data ? `${total.toLocaleString()} matching accounts` : "Directory status"}
            </p>
          </div>
          <StatusBadge status={result.error ? "unavailable" : `${total} records`} />
        </div>
        {result.error ? (
          <AdminErrorState
            message="We couldn’t load the user directory. Your filters are saved; try again."
            retryHref={`/admin/users?${queryString}`}
          />
        ) : result.data?.items.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Account</th>
                  <th>Access</th>
                  <th>Joined</th>
                  <th>Admin actions</th>
                </tr>
              </thead>
              <tbody>
                {result.data.items.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-member-cell">
                        <span className="admin-member-avatar">
                          {user.name.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="admin-table-primary">
                          {user.name}
                          <span className="admin-table-secondary">{user.email}</span>
                        </span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={user.role} />
                    </td>
                    <td>
                      <StatusBadge status={user.isActive ? "active" : "inactive"} />
                    </td>
                    <td>
                      <StatusBadge
                        status={
                          user.isBanned
                            ? "banned"
                            : user.role === "mate" && user.isVerified
                              ? "verified"
                              : "clear"
                        }
                      />
                    </td>
                    <td>{formatAdminDate(user.createdAt)}</td>
                    <td className="admin-actions-cell">
                      <AdminUserActions currentAdminId={session.user.id} user={user} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty-state">
            <span className="admin-empty-state-icon">
              <UsersRound size={18} />
            </span>
            <h3>No accounts found</h3>
            <p>Adjust the search or filters to find accounts.</p>
          </div>
        )}
        {result.data && (
          <AdminPagination
            basePath="/admin/users"
            page={result.data.meta.page}
            search={currentSearch}
            total={result.data.meta.total}
            totalPages={result.data.meta.totalPages}
          />
        )}
      </section>
    </div>
  );
}
