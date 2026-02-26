/**
 * Gaussian splat (.sog) viewer using PlayCanvas Engine (CDN)
 * Renders in #splat-viewer; SOG URL from data-sog (default /scene.sog)
 */

import {
  Application,
  Asset,
  AssetListLoader,
  Color,
  Entity,
  FILLMODE_NONE,
  RESOLUTION_AUTO
} from 'playcanvas'

const CONTAINER_ID = 'splat-viewer'
const FALLBACK_SOG_URL = 'https://developer.playcanvas.com/assets/toy-cat.sog'
const CAMERA_CONTROLS_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/playcanvas/scripts/esm/camera-controls.mjs'

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
  const w = Math.max(1, Math.floor(rect.width))
  const h = Math.max(1, Math.floor(rect.height))
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w
    canvas.height = h
    app.resizeCanvas()
  }
}

async function fetchSogAsArrayBuffer(url) {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
  return res.arrayBuffer()
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
      antialias: false
    }
  })

  app.setCanvasFillMode(FILLMODE_NONE)
  app.setCanvasResolution(RESOLUTION_AUTO)
  app.start()

  resizeCanvas(canvas, app, container)

  const resizeObserver = new ResizeObserver(() => {
    resizeCanvas(canvas, app, container)
  })
  resizeObserver.observe(container)

  // Pre-fetch .sog so the full file is in memory (avoids "EOCDR not found" from truncated responses)
  let sogAsset
  try {
    const arrayBuffer = await fetchSogAsArrayBuffer(sogUrl)
    sogAsset = new Asset('splat', 'gsplat', { url: sogUrl, contents: arrayBuffer })
  } catch (err) {
    console.warn('Splat viewer: fetch failed, trying fallback SOG.', err)
    if (sogUrl !== FALLBACK_SOG_URL) {
      const arrayBuffer = await fetchSogAsArrayBuffer(FALLBACK_SOG_URL)
      sogAsset = new Asset('splat', 'gsplat', { url: FALLBACK_SOG_URL, contents: arrayBuffer })
    } else {
      throw err
    }
  }

  const assets = [
    new Asset('camera-controls', 'script', { url: CAMERA_CONTROLS_SCRIPT_URL }),
    sogAsset
  ]

  const loader = new AssetListLoader(assets, app.assets)

  try {
    await new Promise((resolve, reject) => {
      loader.load(() => resolve())
      loader.on('error', (err) => reject(err))
    })
  } catch (err) {
    console.error('Splat viewer: load error', err)
    throw err
  }

  // Camera: X right, Y up, Z back. Default (0,0,2.5) = 2.5 units in front of origin.
  const cameraPos = parseVec3('data-camera-position', [0, 0, 2.5])
  const camera = new Entity('Camera')
  camera.setPosition(cameraPos[0], cameraPos[1], cameraPos[2])
  const cameraComp = camera.addComponent('camera')
  cameraComp.clearColor = new Color(0, 0, 0, 1)
  camera.addComponent('script')
  camera.script.create('cameraControls')
  app.root.addChild(camera)

  // Splat: position and rotation (Euler X,Y,Z in degrees). Default rotation 0,180,180 faces camera.
  const splatPos = parseVec3('data-splat-position', [-2.2, 0.3, -6])
  const splatRot = parseVec3('data-splat-rotation', [0, 180, 180])
  const splat = new Entity('Splat')
  splat.setPosition(splatPos[0], splatPos[1], splatPos[2])
  splat.setEulerAngles(splatRot[0], splatRot[1], splatRot[2])
  splat.addComponent('gsplat', { asset: assets[1] })
  app.root.addChild(splat)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSplatViewer)
} else {
  initSplatViewer()
}
