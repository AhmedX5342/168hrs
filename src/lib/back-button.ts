import { useEffect, useRef } from "react";

/**
 * Tiny stack of "back button" handlers. The Android hardware back button asks the
 * most recently registered handler first; a handler returns true if it handled the press.
 */
type Handler = () => boolean;
const stack: Handler[] = [];

function push(h: Handler) {
  stack.push(h);
  return () => {
    const i = stack.lastIndexOf(h);
    if (i !== -1) stack.splice(i, 1);
  };
}

/** Returns true if a registered handler consumed the back press. */
export function runBackHandlers(): boolean {
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i]!()) return true;
  }
  return false;
}

/** Register a back-press handler while the component is mounted (always sees latest state). */
export function useBackHandler(handler: Handler, enabled = true) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!enabled) return;
    return push(() => ref.current());
  }, [enabled]);
}
