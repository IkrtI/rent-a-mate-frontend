export default function AdminLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading Admin workspace"
      className="admin-page admin-loading-page"
      role="status"
    >
      <div className="admin-loading-heading">
        <span className="admin-skeleton-block admin-skeleton-label" />
        <span className="admin-skeleton-block admin-skeleton-title" />
        <span className="admin-skeleton-block admin-skeleton-copy" />
      </div>
      <div className="admin-metric-grid" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="admin-skeleton-card" key={index} />
        ))}
      </div>
      <div className="admin-skeleton-grid" aria-hidden="true">
        <div className="admin-skeleton-panel" />
        <div className="admin-skeleton-panel" />
      </div>
      <div className="admin-skeleton-panel admin-skeleton-table" aria-hidden="true" />
    </div>
  );
}
