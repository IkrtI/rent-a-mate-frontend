import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";

export function AdminErrorState({ message, retryHref }: { message: string; retryHref: string }) {
  return (
    <div className="admin-error-state admin-error-state-block" role="status">
      <span className="admin-error-state-icon">
        <AlertTriangle aria-hidden="true" size={17} />
      </span>
      <span>{message}</span>
      <Link className="admin-secondary-button" href={retryHref}>
        <RotateCw aria-hidden="true" size={14} /> Retry
      </Link>
    </div>
  );
}
