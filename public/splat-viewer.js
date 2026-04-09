/**
 * Gaussian splat (.sog) viewer using PlayCanvas Engine (CDN)
 * Renders in #splat-viewer; SOG URL from data-sog (default /scene.sog)
 */

import {
  Application,
  Asset,
  AssetListLoader,
  BLEND_NORMAL,
  Color,
  CULLFACE_NONE,
  Entity,
  FILLMODE_NONE,
  RESOLUTION_FIXED,
  StandardMaterial,
  Vec2
} from 'playcanvas'

const CONTAINER_ID = 'splat-viewer'
const FALLBACK_SOG_URL = 'https://developer.playcanvas.com/assets/toy-cat.sog'
const CAMERA_CONTROLS_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/playcanvas/scripts/esm/camera-controls.mjs'
const MAX_DPR = 1.5

function getSogUrl() {
  const el = document.getElementById(CONTAINER_ID)
  if (!el) return null
  const url = (el.getAttribute('data-sog') || '/scene.sog').trim()
  return url || FALLBACK_SOG_URL
}

/** Parse "x,y,z" into [x,y,z] (numbers). Returns null if missing/invalid. */
function parseVec3(attr, defaults) {
  const el = document.getElementById(CONTAINER_ID)
  const raw = el?.getAttribute(attr)?.trim()
  if (!raw) return defaults
  const parts = raw.split(',').map((s) => Number(s.trim()))
  if (parts.length !== 3 || parts.some(Number.isNaN)) return defaults
  return parts
}

function resizeCanvas(canvas, app, container) {
  if (!container || !canvas || !app) return
  const rect = container.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
  const w = Math.max(1, Math.floor(rect.width * dpr))
  const h = Math.max(1, Math.floor(rect.height * dpr))
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w
    canvas.height = h
    app.resizeCanvas()
  }
}

const LOADER_IMAGES = [
  '/image0.webp',
  '/image1.webp',
  '/image2.webp',
  '/image3.webp',
  '/image4.webp',
  '/image5.webp',
  '/image6.webp',
  '/image7.webp',
  '/image8.webp'
]
const SLIDE_INTERVAL = 800

function createLoader(container) {
  const wrap = container.closest('.splat-viewer-wrap') || container
  const el = document.createElement('div')
  el.className = 'splat-loader'

  const imagesHtml = LOADER_IMAGES.map((src, i) =>
    `<img class="splat-loader-img${i === 0 ? ' active' : ''}" src="${src}" alt="" draggable="false" />`
  ).join('')

  el.innerHTML = `
    <div class="splat-loader-slides">${imagesHtml}</div>
    <div class="splat-loader-bar-wrap">
      <div class="splat-loader-bar"></div>
    </div>
    <span class="splat-loader-pct">0</span>
  `
  wrap.appendChild(el)

  const pctEl = el.querySelector('.splat-loader-pct')
  const barEl = el.querySelector('.splat-loader-bar')
  const imgs = el.querySelectorAll('.splat-loader-img')
  let slideIdx = 0

  const slideTimer = setInterval(() => {
    imgs[slideIdx].classList.remove('active')
    slideIdx = (slideIdx + 1) % imgs.length
    imgs[slideIdx].classList.add('active')
  }, SLIDE_INTERVAL)

  return {
    set(pct) {
      const v = Math.min(100, Math.max(0, Math.round(pct)))
      pctEl.textContent = v
      barEl.style.width = v + '%'
    },
    done() {
      clearInterval(slideTimer)
      this.set(100)
      el.classList.add('splat-loader-done')
      setTimeout(() => el.remove(), 900)
    }
  }
}

const GYRO_SENSITIVITY = 0.07
const GYRO_LERP = 0.05
const GYRO_MAX_OFFSET = 1.5

function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v
}

function vibrate(pattern) {
  if (!navigator.vibrate) return
  navigator.vibrate(pattern)
}

const HAPTIC = {
  success: () => vibrate([10, 50, 30]),
  bump:    () => vibrate([15]),
  buzz:    () => vibrate([20, 10, 20]),
}

const GYRO_CHANGE_THRESHOLD = 0.0005

function initGyroControls(container, splat, baseRot, app) {
  if (!window.DeviceOrientationEvent) return

  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
  if (!isMobile) return

  const wrap = container.closest('.splat-viewer-wrap') || container
  let gyroEnabled = false

  let refAlpha = null
  let refBeta = null
  let refGamma = null

  let targetYaw = 0
  let targetPitch = 0
  let currentYaw = 0
  let currentPitch = 0

  let atYawBoundary = false
  let atPitchBoundary = false

  function onOrientation(e) {
    if (e.alpha === null || e.beta === null || e.gamma === null) return

    if (refAlpha === null) {
      refAlpha = e.alpha
      refBeta = e.beta
      refGamma = e.gamma
    }

    // Use gamma (left/right tilt) for yaw — stable regardless of phone pitch
    let dGamma = e.gamma - refGamma
    if (dGamma > 180) dGamma -= 360
    if (dGamma < -180) dGamma += 360

    // Use beta (forward/back tilt) for pitch
    let dBeta = e.beta - refBeta
    if (dBeta > 180) dBeta -= 360
    if (dBeta < -180) dBeta += 360

    const rawYaw = dGamma * GYRO_SENSITIVITY
    const rawPitch = -dBeta * GYRO_SENSITIVITY

    const newAtYawBoundary = Math.abs(rawYaw) >= GYRO_MAX_OFFSET
    const newAtPitchBoundary = Math.abs(rawPitch) >= GYRO_MAX_OFFSET

    // Fire bump haptic only on the leading edge of hitting the boundary
    if ((newAtYawBoundary && !atYawBoundary) || (newAtPitchBoundary && !atPitchBoundary)) {
      HAPTIC.bump()
    }

    atYawBoundary = newAtYawBoundary
    atPitchBoundary = newAtPitchBoundary

    targetYaw = clamp(rawYaw, -GYRO_MAX_OFFSET, GYRO_MAX_OFFSET)
    targetPitch = clamp(rawPitch, -GYRO_MAX_OFFSET, GYRO_MAX_OFFSET)
  }

  // Hook into PlayCanvas's own update loop — no separate RAF needed
  app.on('update', () => {
    if (!gyroEnabled) return

    const nextYaw = currentYaw + (targetYaw - currentYaw) * GYRO_LERP
    const nextPitch = currentPitch + (targetPitch - currentPitch) * GYRO_LERP

    const yawDelta = Math.abs(nextYaw - currentYaw)
    const pitchDelta = Math.abs(nextPitch - currentPitch)

    // Skip setEulerAngles when movement is negligible
    if (yawDelta < GYRO_CHANGE_THRESHOLD && pitchDelta < GYRO_CHANGE_THRESHOLD) return

    currentYaw = Math.abs(nextYaw) < 0.001 ? 0 : nextYaw
    currentPitch = Math.abs(nextPitch) < 0.001 ? 0 : nextPitch

    splat.setEulerAngles(
      baseRot[0] + currentPitch,
      baseRot[1] + currentYaw,
      baseRot[2]
    )
  })

  async function enableGyro() {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const perm = await DeviceOrientationEvent.requestPermission()
        if (perm !== 'granted') return
      } catch { return }
    }
    gyroEnabled = true
    HAPTIC.success()
    window.addEventListener('deviceorientation', onOrientation)
  }

  const overlay = document.createElement('div')
  overlay.className = 'splat-gyro-prompt'
  overlay.innerHTML = `
    <div class="splat-gyro-prompt-box">
      <p>Enable motion controls?</p>
      <div class="splat-gyro-prompt-actions">
        <button class="splat-gyro-prompt-btn splat-gyro-yes">Yes</button>
        <button class="splat-gyro-prompt-btn splat-gyro-no">No</button>
      </div>
    </div>
  `
  wrap.appendChild(overlay)

  function dismiss() {
    overlay.classList.add('splat-gyro-prompt-hide')
    setTimeout(() => overlay.remove(), 500)
  }

  overlay.querySelector('.splat-gyro-yes').addEventListener('click', async () => {
    await enableGyro()
    dismiss()
  })

  overlay.querySelector('.splat-gyro-no').addEventListener('click', () => {
    HAPTIC.buzz()
    dismiss()
  })
}

async function fetchSogWithProgress(url, onProgress) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)

  const total = parseInt(res.headers.get('content-length') || '0', 10)
  if (!total || !res.body) {
    const buf = await res.arrayBuffer()
    onProgress(100)
    return buf
  }

  const reader = res.body.getReader()
  const chunks = []
  let received = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.byteLength
    onProgress((received / total) * 100)
  }

  const buf = new Uint8Array(received)
  let offset = 0
  for (const chunk of chunks) {
    buf.set(chunk, offset)
    offset += chunk.byteLength
  }
  return buf.buffer
}

function addStickerPlanes(app) {
  const dreamAsset = new Asset('dream-sticker', 'texture', { url: '/DreamSticker.webp' })
  const hereAsset  = new Asset('here-sticker',  'texture', { url: '/AreyoureallyhereSticker.webp' })
  app.assets.add(dreamAsset)
  app.assets.add(hereAsset)

  let loadedCount = 0
  function onBothLoaded() {
    if (++loadedCount < 2) return

    function makeMat(tex) {
      const mat = new StandardMaterial()
      mat.emissiveMap = tex
      mat.emissive = new Color(1, 1, 1)
      mat.emissiveMapTiling = new Vec2(1, -1)
      mat.emissiveMapOffset = new Vec2(0, 1)
      mat.opacityMap = tex
      mat.opacityMapTiling = new Vec2(1, -1)
      mat.opacityMapOffset = new Vec2(0, 1)
      mat.blendType = BLEND_NORMAL
      mat.depthWrite = false
      mat.cull = CULLFACE_NONE
      mat.update()
      return mat
    }

    const matDream = makeMat(dreamAsset.resource)
    const matHere  = makeMat(hereAsset.resource)

    // All X positions kept in -1.0 to -0.2 range — the visible band on portrait mobile.
    // x < -1.0 is off-screen left based on observed viewport.
    const configs = [
      { pos: [-0.5,  2.9, -2.2], rot: [-90, 0, -15], scale: [1.12, 1, 0.41], mat: matDream }, // close  → appears large
      { pos: [ 0.3,  0.7, -5.8], rot: [-90, 0,  10], scale: [1.12, 1, 0.41], mat: matHere  }, // far    → appears small
      { pos: [-0.4,  0.6, -3.8], rot: [-90, 0,  -8], scale: [1.12, 1, 0.41], mat: matDream }, // medium
      { pos: [-0.1,  1.3, -3.0], rot: [-90, 0,  13], scale: [1.01, 1, 0.36], mat: matHere  }, // close-medium → larger
      { pos: [-0.2, -0.3, -5.2], rot: [-90, 0, -17], scale: [1.12, 1, 0.41], mat: matDream }, // far-medium → smaller
      { pos: [ 0.5,  1.6, -4.4], rot: [-90, 0,   6], scale: [1.01, 1, 0.36], mat: matHere  }, // medium
    ]

    configs.forEach(({ pos, rot, scale, mat }, i) => {
      const sticker = new Entity(`Sticker_${i}`)
      sticker.addComponent('render', { type: 'plane' })
      sticker.render.meshInstances[0].material = mat
      sticker.setPosition(pos[0], pos[1], pos[2])
      sticker.setEulerAngles(rot[0], rot[1], rot[2])
      sticker.setLocalScale(scale[0], scale[1], scale[2])
      app.root.addChild(sticker)
    })
  }

  dreamAsset.ready(onBothLoaded)
  hereAsset.ready(onBothLoaded)
  app.assets.load(dreamAsset)
  app.assets.load(hereAsset)
}

async function initSplatViewer() {
  const container = document.getElementById(CONTAINER_ID)
  if (!container) return

  const sogUrl = getSogUrl()
  if (!sogUrl) return

  const canvas = document.createElement('canvas')
  canvas.style.display = 'block'
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  container.appendChild(canvas)

  const app = new Application(canvas, {
    graphicsDeviceOptions: {
      antialias: false,
      powerPreference: 'low-power',
      preserveDrawingBuffer: false
    }
  })

  app.setCanvasFillMode(FILLMODE_NONE)
  app.setCanvasResolution(RESOLUTION_FIXED)
  app.start()

  resizeCanvas(canvas, app, container)

  const resizeObserver = new ResizeObserver(() => {
    resizeCanvas(canvas, app, container)
  })
  resizeObserver.observe(container)

  const loader = createLoader(container)

  let sogAsset
  try {
    const arrayBuffer = await fetchSogWithProgress(sogUrl, (pct) => loader.set(pct))
    sogAsset = new Asset('splat', 'gsplat', { url: sogUrl, contents: arrayBuffer })
  } catch (err) {
    console.warn('Splat viewer: fetch failed, trying fallback SOG.', err)
    if (sogUrl !== FALLBACK_SOG_URL) {
      loader.set(0)
      const arrayBuffer = await fetchSogWithProgress(FALLBACK_SOG_URL, (pct) => loader.set(pct))
      sogAsset = new Asset('splat', 'gsplat', { url: FALLBACK_SOG_URL, contents: arrayBuffer })
    } else {
      throw err
    }
  }

  const assets = [
    new Asset('camera-controls', 'script', { url: CAMERA_CONTROLS_SCRIPT_URL }),
    sogAsset
  ]

  const assetLoader = new AssetListLoader(assets, app.assets)

  try {
    await new Promise((resolve, reject) => {
      assetLoader.load(() => resolve())
      assetLoader.on('error', (err) => reject(err))
    })
  } catch (err) {
    console.error('Splat viewer: load error', err)
    throw err
  }

  loader.done()

  // Camera: X right, Y up, Z back. Default (0,0,2.5) = 2.5 units in front of origin.
  const cameraPos = parseVec3('data-camera-position', [0, 0, 2.5])
  const camera = new Entity('Camera')
  camera.setPosition(cameraPos[0], cameraPos[1], cameraPos[2])
  const cameraComp = camera.addComponent('camera')
  cameraComp.clearColor = new Color(0, 0, 0, 1)
  camera.addComponent('script')
  const controls = camera.script.create('cameraControls')
  controls.enablePan = false
  controls.enableFly = false
  controls.pitchRange = new Vec2(-5, 5)
  controls.yawRange = new Vec2(-5, 5)
  controls.zoomRange = new Vec2(0.4, 0.5)
  controls.rotateDamping = 0.992
  controls.rotateSpeed = 0.06
  app.root.addChild(camera)

  // Splat: position and rotation (Euler X,Y,Z in degrees). Default rotation 0,180,180 faces camera.
  const splatPos = parseVec3('data-splat-position', [-2.2, 0.3, -9])
  const splatRot = parseVec3('data-splat-rotation', [0, 180, 180])
  const splat = new Entity('Splat')
  splat.setPosition(splatPos[0], splatPos[1], splatPos[2])
  splat.setEulerAngles(splatRot[0], splatRot[1], splatRot[2])
  splat.addComponent('gsplat', { asset: assets[1] })
  app.root.addChild(splat)

  addStickerPlanes(app)

  initGyroControls(container, splat, splatRot, app)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSplatViewer)
} else {
  initSplatViewer()
}
