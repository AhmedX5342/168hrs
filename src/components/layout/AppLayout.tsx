import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/features/settings/use-settings";
import { useEnsureWeeks } from "@/features/weeks/use-weeks";
import { Onboarding } from "@/features/onboarding/Onboarding";
import { useAndroidBack } from "@/hooks/use-android-back";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { LoadingScreen } from "./LoadingScreen";

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

/** Data lives in localStorage, so the shell renders only after hydration. */
function AppLayoutComponent(props: AppLayoutProps) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  useAndroidBack();

  if (!hydrated) return <LoadingScreen />;
  return <Shell {...props} />;
}

export const AppLayout = React.memo(AppLayoutComponent);
