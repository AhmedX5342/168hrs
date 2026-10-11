import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { clearAll, exportAll, importAll } from "@/lib/storage";
import { toast } from "@/lib/toast";
import { useSettings } from "@/features/settings/use-settings";
import { WEEKDAY_OPTIONS, type WeekStartDay } from "@/features/settings/types";
import { LIFE_AREA_ICONS, LifeAreaIcon } from "@/features/life-areas/icons";

export function SettingsPage() {
  const { settings, patch, weeklySleepHours } = useSettings();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [areaName, setAreaName] = useState("");
  const [areaIcon, setAreaIcon] = useState("sparkles");

  const doExport = () => {
    const blob = new Blob([JSON.stringify(exportAll(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "168hrs-backup.json";
    a.click();
    toast.success("Data exported");
  };
  const doImport = async (file: File) => {
    try {
      importAll(JSON.parse(await file.text()));
      await qc.invalidateQueries();
      toast.success("Data imported");
    } catch {
      toast.error("That file couldn't be read");
    }
  };

  return (
    <>
      <PageHeader eyebrow="Preferences" title="Settings" />
      <Tabs defaultValue="general">
        <TabsList className="mb-6 flex h-auto flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="sleep">Sleep</TabsTrigger>
          <TabsTrigger value="areas">Life areas</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="max-w-md space-y-5">
          <div className="space-y-1.5">
            <Label>Display name</Label>
            <Input
              defaultValue={settings.name}
              onBlur={(e) => patch({ name: e.target.value.trim() })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>First day of the week</Label>
            <Select
              value={String(settings.weekStartsOn)}
              onValueChange={(v) => patch({ weekStartsOn: Number(v) as WeekStartDay })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEEKDAY_OPTIONS.map((d) => (
                  <SelectItem key={d.value} value={String(d.value)}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Clock format</Label>
            <Select
              value={settings.clockFormat}
              onValueChange={(v) => patch({ clockFormat: v === "12" ? "12" : "24" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24">24-hour</SelectItem>
                <SelectItem value="12">12-hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-xl border px-3 py-3">
            <div>
              <div className="text-sm font-medium">Display unscheduled tasks</div>
              <p className="text-xs text-muted-foreground">
                Show them on Today and count toward capacity
              </p>
            </div>
            <Switch
              checked={settings.showUnscheduled}
              onCheckedChange={(c) => patch({ showUnscheduled: c })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Theme</Label>
            <Select
              value={settings.theme}
              onValueChange={(v) => patch({ theme: v === "dark" ? "dark" : "light" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="sleep" className="max-w-md space-y-5">
          <div className="space-y-1.5">
            <Label>Target sleep hours per night</Label>
            <Input
              type="number"
              min={0}
              max={16}
              step={0.5}
              defaultValue={settings.sleepHoursPerDay}
              onBlur={(e) =>
                patch({ sleepHoursPerDay: Math.min(16, Math.max(0, Number(e.target.value) || 0)) })
              }
            />
            <p className="text-xs text-muted-foreground">
              {settings.sleepHoursPerDay}h × 7 = {weeklySleepHours}h sleep / week ·{" "}
              {168 - weeklySleepHours}h awake capacity
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Usual bedtime</Label>
              <Input
                type="time"
                defaultValue={settings.sleepBedtime}
                onBlur={(e) => patch({ sleepBedtime: e.target.value || "23:00" })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Usual wake time</Label>
              <Input
                type="time"
                defaultValue={settings.sleepWakeTarget}
                onBlur={(e) => patch({ sleepWakeTarget: e.target.value || "07:00" })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Ideal sleep (hrs) — excess is “wasted”</Label>
            <Input
              type="number"
              min={4}
              max={12}
              step={0.5}
              defaultValue={settings.idealSleepHours}
              onBlur={(e) =>
                patch({ idealSleepHours: Math.min(12, Math.max(4, Number(e.target.value) || 8)) })
              }
            />
            <p className="text-xs text-muted-foreground">
              Default 8h. On first open each day you log actual wake time.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="areas" className="max-w-xl space-y-6">
          <div className="space-y-2">
            {settings.lifeAreas.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-2xl border bg-card p-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <LifeAreaIcon icon={a.icon} className="size-4" />
                </div>
                <span className="flex-1 font-medium">{a.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${a.name}`}
                  onClick={() =>
                    patch({ lifeAreas: settings.lifeAreas.filter((x) => x.id !== a.id) })
                  }
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>
          <div className="space-y-3 rounded-2xl border border-dashed p-4">
            <Label>New life area</Label>
            <Input
              placeholder="Freelance"
              value={areaName}
              onChange={(e) => setAreaName(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {Object.keys(LIFE_AREA_ICONS).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-label={k}
                  onClick={() => setAreaIcon(k)}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-xl border transition-colors",
                    areaIcon === k
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-accent",
                  )}
                >
                  <LifeAreaIcon icon={k} className="size-4" />
                </button>
              ))}
            </div>
            <Button
              onClick={async () => {
                const name = areaName.trim();
                if (!name) {
                  toast.error("Give the life area a name");
                  return;
                }
                await patch({
                  lifeAreas: [
                    ...settings.lifeAreas,
                    { id: crypto.randomUUID(), name, icon: areaIcon },
                  ],
                });
                setAreaName("");
                toast.success("Life area added", name);
              }}
            >
              <Plus /> Add
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="data" className="flex max-w-md flex-col gap-3">
          <Button variant="outline" onClick={doExport}>
            <Download /> Export data
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload /> Import data
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void doImport(f);
            }}
          />
          <Button
            variant="destructive"
            onClick={async () => {
              if (!window.confirm("Clear all data? This cannot be undone.")) return;
              clearAll();
              await qc.invalidateQueries();
              toast.success("All data cleared");
            }}
          >
            <Trash2 /> Clear all data
          </Button>
        </TabsContent>
      </Tabs>
    </>
  );
}
