import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { runBackHandlers } from "@/lib/back-button";

/** Top-level tabs: back from these goes to Today instead of stepping through tab history. */
const TAB_ROOTS = ["/week", "/tasks", "/settings"];

/** Anything Radix renders as an open overlay that Escape would close. */
const OPEN_OVERLAY =
  '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [role="menu"][data-state="open"], [role="listbox"][data-state="open"]';

/**
 * Makes the Android hardware back button behave like the in-app back buttons
 * instead of closing the app. Must be used inside <BrowserRouter>.
 *
 * Order: custom handlers (e.g. onboarding steps, focus timer) → close open dialog/menu →
 * Today exits the app → tabs go to Today → nested pages go back one step.
 */
export function useAndroidBack() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let handle: PluginListenerHandle | undefined;
    let cancelled = false;

    void CapApp.addListener("backButton", () => {
      if (runBackHandlers()) return;

      if (document.querySelector(OPEN_OVERLAY)) {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        return;
      }

      const { pathname, search } = window.location;
      if (pathname === "/") {
        void CapApp.exitApp();
        return;
      }

      const isTab = TAB_ROOTS.includes(pathname) || (pathname === "/notes" && !search);
      const canPop = ((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0;
      if (isTab || !canPop) navigate("/", { replace: true });
      else navigate(-1);
    }).then((h) => {
      if (cancelled) void h.remove();
      else handle = h;
    });

    return () => {
      cancelled = true;
      void handle?.remove();
    };
  }, [navigate]);
}
