/** @typedef {{ duration: number; intensity?: number; delay?: number }} HapticStep */

/** Light “click” double-tap — matches web-haptics-setup.md */
export const CLICK_HAPTIC_PATTERN = /** @type {const} */ ([
  { duration: 80, intensity: 0.8 },
  { delay: 80, duration: 50, intensity: 0.3 },
])
