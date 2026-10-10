import { describe, expect, it } from "vitest";
import { blocksForDate, occursOn } from "./schedule";
import type { Task } from "./types";

const base: Task = {
  id: "1", weekStart: "2026-10-05", title: "T", duration: 60, focus: "deep", repeat: "once",
  days: [], date: null, startTime: "09:00", completions: [], createdAt: 0,
};

describe("occursOn", () => {
  it("weekdays repeat skips Saturday", () => {
    expect(occursOn({ ...base, repeat: "weekdays" }, "2026-10-09")).toBe(true); // Fri
    expect(occursOn({ ...base, repeat: "weekdays" }, "2026-10-10")).toBe(false); // Sat
  });
  it("recurring tasks do not appear before their week", () => {
    expect(occursOn({ ...base, repeat: "daily" }, "2026-10-04")).toBe(false);
  });
  it("one-off without a date is unscheduled", () => {
    expect(blocksForDate([base], "2026-10-05")).toHaveLength(0);
  });
});
