"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  useEffect(() => {
    console.error("Global application error", error.digest ?? error.name);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#17171b",
          color: "#f6f0ed",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
          <section style={{ width: "min(100%, 560px)" }}>
            <p style={{ color: "#ed6870", fontWeight: 700 }}>matefor. · 500</p>
            <h1 style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)", lineHeight: 1.05 }}>
              We couldn’t load the app.
            </h1>
            <p style={{ color: "#b8aeab", lineHeight: 1.7 }}>
              Something went wrong while starting this page. Try again, or return home.
            </p>
            <button
              onClick={reset}
              style={{
                border: 0,
                borderRadius: 999,
                background: "#ed6870",
                color: "white",
                padding: "14px 20px",
                fontWeight: 700,
                cursor: "pointer",
              }}
              type="button"
            >
              Try again
            </button>
            <form action="/" method="get" style={{ display: "inline-block", marginLeft: 18 }}>
              <button
                style={{
                  marginLeft: 18,
                  border: 0,
                  background: "transparent",
                  color: "inherit",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
                type="submit"
              >
                Back to home
              </button>
            </form>
          </section>
        </main>
      </body>
    </html>
  );
}
