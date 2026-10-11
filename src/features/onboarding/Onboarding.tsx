import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/features/settings/use-settings";
import { toast } from "@/lib/toast";

const schema = z.object({ name: z.string().trim().min(1, "Tell us what to call you").max(40) });

const FACTS = [
  { value: "168", label: "hours in every week" },
  { value: "~17h", label: "lost weekly to scrolling, on average" },
  { value: "56h", label: "go to sleep — if you're lucky" },
];

export function Onboarding() {
  const [step, setStep] = useState(0);
  const { patch } = useSettings();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  const onSubmit = form.handleSubmit(async ({ name }) => {
    await patch({ name, onboarded: true });
    toast.success(`Welcome, ${name}`, "Your 168 hours start now.");
  });

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      {step === 0 ? (
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
      ) : (
        <form key="name" onSubmit={onSubmit} className="w-full max-w-sm animate-fade-up">
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
            Start planning <ArrowRight />
          </Button>
        </form>
      )}
    </div>
  );
}
