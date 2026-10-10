const pad = (n: number) => String(n).padStart(2, "0");

/** ISO local date "YYYY-MM-DD" */
export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const fromISO = (s: string) => {
  const [y = 0, m = 1, d = 1] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const todayISO = () => toISO(new Date());

export const addDays = (s: string, n: number) => {
  const d = fromISO(s);
  d.setDate(d.getDate() + n);
  return toISO(d);
};

export const startOfWeek = (s: string, weekStartsOn: 0 | 1) => {
  const d = fromISO(s);
  const diff = (d.getDay() - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - diff);
  return toISO(d);
};

export const weekDates = (start: string) => Array.from({ length: 7 }, (_, i) => addDays(start, i));

export const dayOfWeek = (s: string) => fromISO(s).getDay();

export const formatDate = (s: string, opts: Intl.DateTimeFormatOptions) =>
  fromISO(s).toLocaleDateString("en-GB", opts);

export const timeToMin = (t: string) => {
  const [h = 0, m = 0] = t.split(":").map(Number);
  return h * 60 + m;
};

export const minToTime = (min: number) => {
  const m = ((min % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
};

export const formatDuration = (min: number) => {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
};

export const hours = (min: number) => Math.round((min / 60) * 10) / 10;

export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
