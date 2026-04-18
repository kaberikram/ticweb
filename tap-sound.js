/**
 * Bandpassed noise burst — same profile as web-haptics / haptics.lochie.me (see web-haptics-setup.md).
 * Skipped when prefers-reduced-motion: reduce.
 */

let sharedCtx = null

function getAudioContext() {
  if (typeof window === 'undefined') return null
  if (sharedCtx) return sharedCtx
  if (typeof AudioContext === 'undefined') return null
  sharedCtx = new AudioContext()
  return sharedCtx
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * @param {number} [intensity] 0–1
 */
export function playUiTapSound(intensity = 0.5) {
  if (prefersReducedMotion()) return
  const ctx = getAudioContext()
  if (!ctx) return

  function run() {
    const sampleRate = ctx.sampleRate
    const frameCount = Math.max(1, Math.floor(0.004 * sampleRate))
    const buffer = ctx.createBuffer(1, frameCount, sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < frameCount; i++)
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 25)

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.Q.value = 8
    const f = (2000 + intensity * 2000) * (1 + (Math.random() - 0.5) * 0.3)
    filter.frequency.value = f

    const gainNode = ctx.createGain()
    gainNode.gain.value = 0.5 * intensity

    const src = ctx.createBufferSource()
    src.buffer = buffer
    src.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(ctx.destination)
    src.onended = () => {
      src.disconnect()
      filter.disconnect()
      gainNode.disconnect()
    }
    src.start()
  }

  if (ctx.state === 'suspended') void ctx.resume().then(run)
  else run()
}
