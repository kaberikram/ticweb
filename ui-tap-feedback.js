import { WebHaptics } from 'web-haptics'
import { CLICK_HAPTIC_PATTERN } from './click-haptic.js'
import { playUiTapSound } from './tap-sound.js'

let haptics = null
let attached = false

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** Button-like links (same gesture as primary CTAs) */
const ANCHOR_BUTTON_SELECTOR = [
  'a[href].btn',
  'a[href].nav-button',
  'a[href].rattire-button',
  'a[href].success-btn',
  'a[href].size-guide-link',
  'a[href].get-free-button',
].join(', ')

/**
 * @param {Event} event
 * @returns {Element | null}
 */
function findTapTarget(event) {
  if (!(event.target instanceof Element)) return null

  const el = event.target.closest(
    [
      'button:not([disabled])',
      'input[type="button"]:not([disabled])',
      'input[type="submit"]:not([disabled])',
      'input[type="reset"]:not([disabled])',
      '[role="button"]:not([aria-disabled="true"])',
    ].join(', ')
  )
  if (el) return el

  return event.target.closest(ANCHOR_BUTTON_SELECTOR)
}

/**
 * @param {Event} event
 */
function onDocumentClick(event) {
  if (!(event instanceof MouseEvent)) return
  if (!event.isTrusted) return
  if (event.button !== 0) return
  const target = findTapTarget(event)
  if (!target) return
  if (target.closest('[data-no-tap-feedback]')) return
  if (prefersReducedMotion()) return

  playUiTapSound(0.5)
  void haptics.trigger(CLICK_HAPTIC_PATTERN)
}

/** Idempotent — safe to call from every entry module */
export function initUiTapFeedback() {
  if (attached || typeof document === 'undefined') return
  haptics = new WebHaptics({ debug: false, showSwitch: false })
  document.addEventListener('click', onDocumentClick, true)
  attached = true
}

export function destroyUiTapFeedback() {
  if (!attached) return
  document.removeEventListener('click', onDocumentClick, true)
  haptics?.destroy()
  haptics = null
  attached = false
}
