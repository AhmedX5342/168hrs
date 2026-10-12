import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

const NOTIFICATION_ID = 16801;
const CHANNEL_ID = "focus-timer";

let channelReady = false;
/** True while a "time's up" notification is scheduled (then we don't need an in-app beep). */
let scheduled = false;
/** Bumped on every schedule/cancel so a slow schedule can't overwrite a newer cancel. */
let epoch = 0;

async function ensureReady(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  let { display } = await LocalNotifications.checkPermissions();
  if (display === "prompt" || display === "prompt-with-rationale") {
    display = (await LocalNotifications.requestPermissions()).display;
  }
  if (display !== "granted") return false;
  if (!channelReady && Capacitor.getPlatform() === "android") {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: "Focus timer",
      description: "Lets you know when a focus session is over",
      importance: 5,
      visibility: 1,
      vibration: true,
    });
    channelReady = true;
  }
  return true;
}

/** Schedule a notification for when the countdown ends (fires even if the app is in the background). */
export async function scheduleTimerEnd(title: string, inMs: number) {
  const mine = ++epoch;
  scheduled = false;
  try {
    if (!(await ensureReady()) || mine !== epoch) return;
    await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] });
    if (mine !== epoch) return;
    await LocalNotifications.schedule({
      notifications: [
        {
          id: NOTIFICATION_ID,
          title: "Time's up",
          body: `${title} — your focus session is done.`,
          channelId: CHANNEL_ID,
          schedule: { at: new Date(Date.now() + Math.max(1000, inMs)), allowWhileIdle: true },
        },
      ],
    });
    scheduled = mine === epoch;
  } catch {
    scheduled = false;
  }
}

/** Cancel the pending notification and clear it from the tray if it already fired. */
export async function cancelTimerEnd() {
  epoch++;
  scheduled = false;
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] });
    await LocalNotifications.removeDeliveredNotifications({
      notifications: [{ id: NOTIFICATION_ID }],
    });
  } catch {
    /* ignore */
  }
}

function beep() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [0, 0.35, 0.7].forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, now + t);
      gain.gain.exponentialRampToValueAtTime(0.4, now + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.25);
      osc.start(now + t);
      osc.stop(now + t + 0.3);
    });
    window.setTimeout(() => void ctx.close(), 1500);
  } catch {
    /* ignore */
  }
}

/** In-app alert when the countdown hits zero while the app is open. */
export function alertTimeUp() {
  navigator.vibrate?.([300, 150, 300, 150, 600]);
  if (!scheduled) beep();
}
