import { useEffect, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DAY_SHORT, dayOfWeek, formatDate, weekDates } from "@/lib/dates";
import { toast } from "@/lib/toast";
import { useSettings } from "@/features/settings/use-settings";
import { LifeAreaIcon } from "@/features/life-areas/icons";
import { useTasks } from "./use-tasks";
import type { Task } from "./types";

const NONE = "__none";

const schema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(80),
    hours: z.coerce.number().min(0.25, "At least 15 minutes").max(24, "Max 24 hours"),
    focus: z.enum(["deep", "medium", "light"]),
    lifeAreaId: z.string(),
    repeat: z.enum(["once", "daily", "weekdays", "days"]),
    days: z.array(z.number()),
    date: z.string(),
    startTime: z.string(),
    notes: z.string().max(500).optional(),
  })
  .refine((v) => v.repeat !== "days" || v.days.length > 0, { path: ["days"], message: "Pick at least one day" });

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  weekStart: string;
  task?: Task | undefined;
  defaultDate?: string | undefined;
}

function Field({ label, error, children }: { label: string; error?: string | undefined; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function TaskFormDialog({ open, onOpenChange, weekStart, task, defaultDate }: Props) {
  const { settings } = useSettings();
  const { addTask, updateTask } = useTasks();
  const dates = weekDates(weekStart);

  const form = useForm<FormValues>({ resolver: zodResolver(schema) as never });
  const repeat = form.watch("repeat");
  const errors = form.formState.errors;

  useEffect(() => {
    if (!open) return;
    form.reset({
      title: task?.title ?? "",
      hours: task ? task.duration / 60 : 1,
      focus: task?.focus ?? "medium",
      lifeAreaId: task?.lifeAreaId ?? NONE,
      repeat: task?.repeat ?? "once",
      days: task?.days ?? [],
      date: task?.date ?? defaultDate ?? NONE,
      startTime: task?.startTime ?? "",
      notes: task?.notes ?? "",
    });
  }, [open, task, defaultDate, form]);

  const onSubmit = form.handleSubmit(async (v) => {
    const payload = {
      weekStart: task?.weekStart ?? weekStart,
      title: v.title,
      duration: Math.round(v.hours * 60),
      focus: v.focus,
      lifeAreaId: v.lifeAreaId === NONE ? undefined : v.lifeAreaId,
      repeat: v.repeat,
      days: v.repeat === "days" ? v.days : [],
      date: v.repeat === "once" && v.date !== NONE ? v.date : null,
      startTime: v.startTime || null,
      notes: v.notes ?? "",
    };
    if (task) await updateTask(task.id, payload);
    else await addTask(payload);
    toast.success(task ? "Task updated" : "Task added", v.title);
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-normal">{task ? "Edit task" : "New task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Title" error={errors.title?.message}>
            <Input placeholder="Study session" {...form.register("title")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Time required (hours)" error={errors.hours?.message}>
              <Input type="number" step="0.25" min="0.25" {...form.register("hours")} />
            </Field>
            <Field label="Focus level">
              <Controller
                control={form.control}
                name="focus"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deep">Deep</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>
          <Field label="Life area">
            <Controller
              control={form.control}
              name="lifeAreaId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {settings.lifeAreas.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        <span className="flex items-center gap-2"><LifeAreaIcon icon={a.icon} className="size-4" />{a.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Repeat">
            <Controller
              control={form.control}
              name="repeat"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">One-time</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekdays">Weekdays</SelectItem>
                    <SelectItem value="days">Specific days</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          {repeat === "days" && (
            <Field label="Days" error={errors.days?.message}>
              <Controller
                control={form.control}
                name="days"
                render={({ field }) => (
                  <ToggleGroup
                    type="multiple"
                    variant="outline"
                    className="flex-wrap justify-start"
                    value={field.value.map(String)}
                    onValueChange={(v) => field.onChange(v.map(Number))}
                  >
                    {dates.map((d) => (
                      <ToggleGroupItem key={d} value={String(dayOfWeek(d))} className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                        {DAY_SHORT[dayOfWeek(d)]}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                )}
              />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            {repeat === "once" && (
              <Field label="Day">
                <Controller
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Unscheduled</SelectItem>
                        {dates.map((d) => (
                          <SelectItem key={d} value={d}>{formatDate(d, { weekday: "short", day: "2-digit", month: "short" })}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            )}
            <Field label="Start time (optional)">
              <Input type="time" {...form.register("startTime")} />
            </Field>
          </div>
          <Field label="Notes (optional)">
            <Textarea rows={2} {...form.register("notes")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{task ? "Save" : "Add task"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
