import { useEffect } from "react";
import { KeepAwake } from "@capacitor-community/keep-awake";

/** Keeps the screen on while `active` is true (native wake lock, or the Wake Lock API on web). */
export function useKeepAwake(active: boolean) {
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let held = false;

    const acquire = async () => {
      try {
        const { isSupported } = await KeepAwake.isSupported();
        if (!isSupported || cancelled) return;
        await KeepAwake.keepAwake();
        held = true;
        if (cancelled) await KeepAwake.allowSleep();
      } catch {
        /* not available — the timer still works */
      }
    };
    void acquire();

    // Browsers drop the wake lock when the page is hidden, so take it again on return
    const onVisible = () => {
      if (document.visibilityState === "visible") void acquire();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      if (held) void KeepAwake.allowSleep().catch(() => {});
    };
  }, [active]);
}
