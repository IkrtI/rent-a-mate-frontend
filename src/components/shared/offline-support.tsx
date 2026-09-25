"use client";

import { useEffect, useState } from "react";

export function OfflineSupport() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Offline messaging still works when service workers are unavailable.
      });
    }
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;
  return (
    <div className="offline-notice" role="status" aria-live="polite">
      <span className="offline-notice__dot" aria-hidden="true" />
      <span>You’re offline. Some actions need an internet connection.</span>
      <button onClick={() => window.location.reload()} type="button">
        Retry
      </button>
    </div>
  );
}
