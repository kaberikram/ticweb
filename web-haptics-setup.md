# Using `web-haptics` on button clicks (any project)

This guide describes how to add the same pattern used in this repo: **`web-haptics`** + **`useWebHaptics()`** + **`trigger(pattern)`** inside **`onClick`**.

For **why** iOS Safari is special (no `navigator.vibrate()`), see [`haptic.md`](./haptic.md). The library abstracts those platform details; you mostly wire patterns and call `trigger` from real user gestures.

---

## 1. Install

```bash
npm install web-haptics
```

Version in this repo: `^0.0.6` (pin or upgrade in your own `package.json` as needed).

---

## 2. Define haptic patterns

A pattern is an array of steps. Each step usually has:

- **`duration`** — pulse length (ms)
- **`intensity`** — optional, `0–1`
- **`delay`** — optional wait before this step (ms)

Example — light “click” double-tap (good for nav and small controls):

```ts
// e.g. src/click-haptic.ts
type HapticStep = { duration: number; intensity?: number; delay?: number }

export const CLICK_HAPTIC_PATTERN: HapticStep[] = [
  { duration: 80, intensity: 0.8 },
  { delay: 80, duration: 50, intensity: 0.3 },
]
```

Add more named exports (e.g. `SOFT_TAP`, `STRONG_CONFIRM`) as you need distinct feels.

---

## 3. React: hook and button

Import the React hook from **`web-haptics/react`** (not the bare package path, unless your bundler resolves it the same way).

```tsx
import { useWebHaptics } from 'web-haptics/react'
import { CLICK_HAPTIC_PATTERN } from './click-haptic'

function Example() {
  const { trigger, isSupported } = useWebHaptics()

  return (
    <button
      type="button"
      onClick={() => {
        void trigger(CLICK_HAPTIC_PATTERN)
        // ...your real action (navigate, toggle, etc.)
      }}
    >
      Tap me
    </button>
  )
}
```

- **`isSupported`** — optional: hide haptics-only UI or skip calls if you need explicit branching (the library still no-ops safely when unsupported).
- Use **`void`** on `trigger(...)` if your linter complains about floating promises.

---

## 4. Optional: tap *sound* (same character as [haptics.lochie.me](https://haptics.lochie.me/))

`web-haptics` drives **vibration** where `navigator.vibrate` works. On many desktops (and in some modes) there is **no motor**—so a short **Web Audio** “click” gives audible feedback that matches the *feel* of the official demo.

The **`web-haptics`** package itself implements this in **`WebHaptics`** (`ensureAudio` + `playClick`). It is **not** a sine beep and not a `.mp3` file: it is a **tiny noise burst** shaped and filtered so it reads as a mechanical tap.

**Reference implementation:** [`packages/web-haptics/src/lib/web-haptics/index.ts`](https://github.com/lochie/web-haptics/blob/main/packages/web-haptics/src/lib/web-haptics/index.ts) (see private methods `ensureAudio` and `playClick`).

### What to synthesize (the profile)

1. **One shared `AudioContext`** — create lazily; call **`audioCtx.resume()`** inside the same user gesture as the first tap (Safari / iOS starts suspended).
2. **Buffer length** — about **4 ms** of samples (`0.004 * sampleRate` frames).
3. **Samples** — white noise multiplied by a fast decay: **`(Math.random() * 2 - 1) * Math.exp(-i / 25)`** where **`i`** is the **sample index** (same as upstream).
4. **Filter** — **`BiquadFilter`**, type **`bandpass`**, **`Q = 8`**.
5. **Center frequency** — **`(2000 + intensity * 2000) * jitter`** with **`jitter ≈ 1 ± 0.15`** (random per tap). That puts the band roughly in **2–4 kHz** depending on `intensity` (0–1).
6. **Gain** — **`0.5 * intensity`** into the destination.

Each tap should use a **new buffer** (or a safely non-overlapping voice): do not mutate one shared `AudioBuffer` while a `BufferSource` is still playing.

### Wiring in React

Call your **`playUiTapSound()`** (or equivalent) in the **same** handler as **`trigger(pattern)`** — typically **`onClick`**, so **`AudioContext.resume()`** stays valid on iOS.

```tsx
import { useWebHaptics } from 'web-haptics/react'
import { CLICK_HAPTIC_PATTERN } from './click-haptic'
import { playUiTapSound } from './tap-sound'

<button
  type="button"
  onClick={() => {
    playUiTapSound()
    void trigger(CLICK_HAPTIC_PATTERN)
    // ...navigation, etc.
  }}
>
  Tap
</button>
```

Use a **second intensity or a short delayed second burst** if you want a richer “wave” (e.g. catalogue card) — see [`src/tap-sound.ts`](./src/tap-sound.ts) (`playWaveTapSound`).

### Accessibility

If you skip animation for **`prefers-reduced-motion: reduce`**, also **skip** the tap sound there: otherwise users who opted out of motion still get repeated clicks.

### Mental model

| Piece | Role |
|--------|------|
| `web-haptics` `trigger()` | Vibration pattern (mobile / supported browsers) |
| Bandpassed noise burst | Audible “click” on speakers / headphones, aligned with [lochie/web-haptics](https://github.com/lochie/web-haptics) |

---

## 5. Rules that matter in production

### Trigger from **`click`**, not **`pointerdown`**, for the main tap

On iOS, **`web-haptics`** relies on **trusted user gestures** for some fallback paths. Firing haptics from **`onClick`** (or an equivalent **`click`** handler) matches a real button tap and matches what this library expects.

Avoid: “haptic on first `pointerdown`” for the same interaction if you need consistent iOS behavior — the codebase comment is: use **`click`** for parity with `<button onClick={trigger}>`.

### Imperative / canvas code

If you attach listeners by hand (e.g. on a div), still dispatch or handle **`click`** for the haptic, or keep a ref to `trigger` and call it from the same path a button would use.

### Accessibility

If the rest of the UI respects **`prefers-reduced-motion`**, consider skipping `trigger` when reduced motion is enabled so vibration doesn’t fight the user’s settings.

---

## 6. Minimal checklist for another project

| Step | Action |
|------|--------|
| 1 | `npm install web-haptics` |
| 2 | Add a small module with `HapticStep[]` patterns |
| 3 | `useWebHaptics()` in components that need feedback |
| 4 | `onClick={() => { void trigger(PATTERN); ... }}` on buttons |
| 5 | Don’t rely on `pointerdown` alone for iOS-friendly tap haptics |
| 6 | *(Optional)* Add `tap-sound`-style Web Audio and call it beside `trigger` |

---

## 7. Related files in this repo

| File | Role |
|------|------|
| [`src/click-haptic.ts`](./src/click-haptic.ts) | Shared `CLICK_HAPTIC_PATTERN`, `WAVE_TAP_HAPTIC_PATTERN` |
| [`src/tap-sound.ts`](./src/tap-sound.ts) | Bandpassed noise tap (`playUiTapSound`, `playWaveTapSound`) — same *sound profile* as upstream `playClick` |
| [`src/App.tsx`](./src/App.tsx) | Navbar / menu: sound + `trigger(CLICK_HAPTIC_PATTERN)` on clicks |
| [`src/components/hero-pekaak.tsx`](./src/components/hero-pekaak.tsx) | Ripple surface: `playWaveTapSound` + `trigger`; tied to **`click`** for iOS |
| [`haptic.md`](./haptic.md) | Background on iOS Safari and vibration workarounds (not install steps) |

Copy the pattern module + hook usage; you do not need to copy app-specific UI.
