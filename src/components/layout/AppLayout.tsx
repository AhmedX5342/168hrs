import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { initStorage } from "@/lib/storage";
import { useSettings } from "@/features/settings/use-settings";
import { useEnsureWeeks } from "@/features/weeks/use-weeks";
import { Onboarding } from "@/features/onboarding/Onboarding";
import { useAndroidBack } from "@/hooks/use-android-back";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { LOADER_REVOLUTION_MS, LoadingScreen } from "./LoadingScreen";

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

function Shell({ children, className }: AppLayoutProps) {
  const { settings } = useSettings();
  useEnsureWeeks();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.theme === "dark");
  }, [settings.theme]);

  if (!settings.onboarded) return <Onboarding />;

  return (
    <div className="flex min-h-screen">
      <Sidebar name={settings.name} />
      <main className={cn("min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-8 md:pb-12 md:pt-10", className)}>
        <div className="mx-auto max-w-6xl animate-fade-up">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}

/** Wait for Dexie migration + cache preload before rendering app data. */
function AppLayoutComponent(props: AppLayoutProps) {
  const qc = useQueryClient();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const started = Date.now();
    void initStorage(qc)
      .then(async () => {
        const wait = Math.max(0, LOADER_REVOLUTION_MS - (Date.now() - started));
        if (wait) await new Promise((r) => setTimeout(r, wait));
        if (!cancelled) setReady(true);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load data");
      });
    return () => {
      cancelled = true;
    };
  }, [qc]);

  useAndroidBack();

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-display text-2xl">Couldn’t open your data</p>
        <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
        <button
          type="button"
          className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!ready) return <LoadingScreen />;
  return <Shell {...props} />;
}

export const AppLayout = React.memo(AppLayoutComponent);
