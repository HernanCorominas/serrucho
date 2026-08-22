/**
 * Safe mobile haptic feedback helper for web and mobile browsers.
 * Uses navigator.vibrate when supported.
 */

export function hapticLight(): void {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(10);
    } catch {
      // Ignore vibration errors
    }
  }
}

export function hapticSuccess(): void {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([15, 50, 20]);
    } catch {
      // Ignore vibration errors
    }
  }
}

export function hapticImpact(): void {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([25, 40, 25]);
    } catch {
      // Ignore vibration errors
    }
  }
}
