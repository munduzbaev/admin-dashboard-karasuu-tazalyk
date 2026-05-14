import { useEffect, useRef } from "react";

/**
 * Calls `callback` every `intervalMs` milliseconds while the tab is visible.
 * Pauses when the document is hidden (saves bandwidth) and resumes when
 * the user comes back. Default 30 seconds.
 *
 * Usage:
 *   useAutoRefresh(fetchData);
 *   useAutoRefresh(fetchData, 60_000); // every minute
 */
export function useAutoRefresh(callback: () => void, intervalMs: number = 30_000) {
  // Keep latest callback ref to avoid re-creating interval on every render
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (id != null) return;
      id = setInterval(() => cbRef.current(), intervalMs);
    };

    const stop = () => {
      if (id != null) {
        clearInterval(id);
        id = null;
      }
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs]);
}
