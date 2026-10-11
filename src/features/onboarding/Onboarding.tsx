import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Moon, Plus, Sun, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useSettings } from "@/features/settings/use-settings";
import {
  DEFAULT_SETTINGS,
  WEEKDAY_OPTIONS,
  type LifeArea,
  type WeekStartDay,
} from "@/features/settings/types";
import { LIFE_AREA_ICONS, LifeAreaIcon } from "@/features/life-areas/icons";

const schema = z.object({ name: z.string().trim().min(1, "Tell us what to call you").max(40) });

const FACTS = [
  { value: "168", label: "hours in every week" },
  { value: "~17h", label: "lost weekly to scrolling, on average" },
  { value: "56h", label: "go to sleep — if you're lucky" },
];

const TOTAL_STEPS = 3;

function ProgressBar({ current }: { current: number }) {
  return (
    <div
      className="mb-10 flex gap-2"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={TOTAL_STEPS}
      aria-valuenow={current}
      aria-label={`Step ${current} of ${TOTAL_STEPS}`}
    >
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full bg-primary transition-all duration-500",
              i < current ? "w-full" : "w-0",
            )}
          />
        </div>
      ))}
    </div>
  );
}

export function Onboarding() {
  /** 0 = intro, 1 = name, 2 = life areas, 3 = preferences */
  const [step, setStep] = useState(0);
  const { settings, patch } = useSettings();

  // Draft values — committed on finish (theme is applied immediately instead)
  const [lifeAreas, setLifeAreas] = useState<LifeArea[]>(DEFAULT_SETTINGS.lifeAreas);
  const [weekStartsOn, setWeekStartsOn] = useState<WeekStartDay>(DEFAULT_SETTINGS.weekStartsOn);
  const [clockFormat, setClockFormat] = useState<"12" | "24">(DEFAULT_SETTINGS.clockFormat);
  const [notesEnabled, setNotesEnabled] = useState(DEFAULT_SETTINGS.notesEnabled);

  // Add-area form
  const [adding, setAdding] = useState(false);
  const [areaName, setAreaName] = useState("");
  const [areaIcon, setAreaIcon] = useState("sparkles");

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  const goNextFromName = form.handleSubmit(() => setStep(2));

  const addArea = () => {
    const name = areaName.trim();
    if (!name) {
      toast.error("Give the life area a name");
      return;
    }
    setLifeAreas((prev) => [...prev, { id: crypto.randomUUID(), name, icon: areaIcon }]);
    setAreaName("");
    setAreaIcon("sparkles");
    setAdding(false);
  };

  const finish = async () => {
    const { name } = form.getValues();
    await patch({
      name: name.trim(),
      lifeAreas,
      weekStartsOn,
      clockFormat,
      notesEnabled,
      onboarded: true,
    });
    toast.success(`Welcome, ${name.trim()}`, "Your 168 hours start now.");
  };

  // ── Intro ────────────────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-12">
        <div key="intro" className="max-w-xl animate-fade-up text-center">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Welcome to
          </p>
          <h1 className="text-8xl text-gradient-primary sm:text-9xl">168hrs</h1>
          <p className="mx-auto mt-6 max-w-md text-lg text-muted-foreground">
            Every week holds exactly 168 hours. Most of us underestimate them — and let
            notifications, feeds and noise drain the time, energy and focus we do have.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-3">
            {FACTS.map((f, i) => (
              <div
                key={f.label}
                className="rounded-2xl border bg-card p-4 animate-fade-up"
                style={{ animationDelay: `${150 + i * 100}ms` }}
              >
                <div className="font-display text-3xl">{f.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{f.label}</div>
              </div>
            ))}
          </div>
          <Button size="lg" className="mt-10 rounded-full px-8" onClick={() => setStep(1)}>
            Take them back <ArrowRight />
          </Button>
        </div>
      </div>
    );
  }

  // ── Steps 1–3 ────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <ProgressBar current={step} />

        {/* Step 1 — name */}
        {step === 1 && (
          <form key="name" onSubmit={goNextFromName} className="animate-fade-up">
            <h2 className="text-5xl">What should we call you?</h2>
            <p className="mt-3 text-muted-foreground">Just a first name is fine.</p>
            <div className="mt-8 space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                autoFocus
                placeholder="your name"
                className="h-12 text-base"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <Button type="submit" size="lg" className="mt-6 w-full rounded-full">
              Next <ArrowRight />
            </Button>
          </form>
        )}

        {/* Step 2 — life areas */}
        {step === 2 && (
          <div key="areas" className="animate-fade-up">
            <h2 className="text-5xl">Your life areas</h2>
            <p className="mt-3 text-muted-foreground">
              Group your time by what matters. Keep these, remove any, or add your own.
            </p>

            <div className="mt-8 space-y-2">
              {lifeAreas.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-2xl border bg-card p-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <LifeAreaIcon icon={a.icon} className="size-4" />
                  </div>
                  <span className="flex-1 font-medium">{a.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${a.name}`}
                    onClick={() => setLifeAreas((prev) => prev.filter((x) => x.id !== a.id))}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
              {lifeAreas.length === 0 && !adding && (
                <p className="rounded-2xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                  No life areas yet. Add one, or continue and add them later in Settings.
                </p>
              )}
            </div>

            {adding ? (
              <div className="mt-3 space-y-3 rounded-2xl border border-dashed p-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="area-name">New life area</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Cancel"
                    onClick={() => {
                      setAdding(false);
                      setAreaName("");
                    }}
                  >
                    <X />
                  </Button>
                </div>
                <Input
                  id="area-name"
                  autoFocus
                  placeholder="Freelance"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addArea();
                    }
                  }}
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
                <Button type="button" onClick={addArea}>
                  <Plus /> Add
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="mt-3 w-full border-dashed"
                onClick={() => setAdding(true)}
              >
                <Plus /> Add life area
              </Button>
            )}

            <div className="mt-8 flex gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="rounded-full"
                onClick={() => setStep(1)}
              >
                <ArrowLeft /> Previous
              </Button>
              <Button
                type="button"
                size="lg"
                className="flex-1 rounded-full"
                onClick={() => setStep(3)}
              >
                Next <ArrowRight />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — preferences */}
        {step === 3 && (
          <div key="prefs" className="animate-fade-up">
            <h2 className="text-5xl">Make it yours</h2>
            <p className="mt-3 text-muted-foreground">
              You can change any of this later in Settings.
            </p>

            <div className="mt-8 space-y-5">
              <div className="space-y-1.5">
                <Label>Theme</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      { value: "light", label: "Light", Icon: Sun },
                      { value: "dark", label: "Dark", Icon: Moon },
                    ] as const
                  ).map(({ value, label, Icon }) => {
                    const active = settings.theme === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => void patch({ theme: value })}
                        className={cn(
                          "flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "hover:bg-accent",
                        )}
                      >
                        <Icon className="size-4" /> {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>First day of the week</Label>
                <Select
                  value={String(weekStartsOn)}
                  onValueChange={(v) => setWeekStartsOn(Number(v) as WeekStartDay)}
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
                  value={clockFormat}
                  onValueChange={(v) => setClockFormat(v === "12" ? "12" : "24")}
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
                  <div className="text-sm font-medium">Notes</div>
                  <p className="text-xs text-muted-foreground">Show the Notes page in navigation</p>
                </div>
                <Switch checked={notesEnabled} onCheckedChange={setNotesEnabled} />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="rounded-full"
                onClick={() => setStep(2)}
              >
                <ArrowLeft /> Previous
              </Button>
              <Button
                type="button"
                size="lg"
                className="flex-1 rounded-full"
                onClick={() => void finish()}
              >
                Start planning <ArrowRight />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
