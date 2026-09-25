"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  useEffect(() => {
    console.error("Application error", error.digest ?? error.name);
  }, [error]);

  return (
    <main className="status-page">
      <div className="status-page__content">
        <Link className="status-page__brand" href="/" aria-label="matefor home">
          <span className="status-page__mark">m</span> matefor.
        </Link>
        <p className="status-page__code">500</p>
        <p className="status-page__eyebrow">A temporary hiccup</p>
        <h1>We couldn’t load this page.</h1>
        <p className="status-page__description">
          Something went wrong on our side. Try again in a moment, or head back home.
        </p>
        <div className="status-page__actions">
          <button className="status-page__action" onClick={reset} type="button">
            Try again <span aria-hidden="true">↻</span>
          </button>
          <Link className="status-page__secondary" href="/">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
