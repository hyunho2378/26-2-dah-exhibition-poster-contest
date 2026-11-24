// Stellarium Web Engine 연결부. 엔진은 한 번만 띄우고 하늘 화면을 다시 열 때 같은 캔버스를 붙인다.
// 엔진 원본: https://github.com/Stellarium/stellarium-web-engine (AGPL-3.0)
import { observer as obsData } from '../data/site.js'
import { sky as skyTokens } from '../tokens.js'
import { asset } from '../asset.js'

let enginePromise = null
let canvasEl = null

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (window.StelWebEngine) return resolve()
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('engine script'))
    document.head.appendChild(s)
  })
}

export function getCanvas() {
  if (!canvasEl) {
    canvasEl = document.createElement('canvas')
    canvasEl.className = 'sky-canvas'
    canvasEl.setAttribute('aria-label', '한림대학교에서 올려다본 2026년 11월 23일 밤하늘')
    canvasEl.setAttribute('role', 'img')
  }
  return canvasEl
}

export function loadEngine() {
  if (enginePromise) return enginePromise
  const canvas = getCanvas()
  // 휴대폰에서 그래픽 자원을 뺏기면 하늘이 비므로, 그럴 때는 페이지를 다시 불러 하늘을 되살린다.
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault()
    window.setTimeout(() => window.location.reload(), 1500)
  })
  enginePromise = loadScript(asset('/engine/stellarium-web-engine.js')).then(
    () =>
      new Promise((resolve) => {
        window.StelWebEngine({
          wasmFile: asset('/engine/stellarium-web-engine.wasm'),
          canvas,
          onReady: (stel) => {
            setupSky(stel)
            stel.paused = true // 하늘 화면에 붙을 때까지 그리지 않는다
            if (import.meta.env.DEV) window.__stel = stel
            resolve(stel)
          },
        })
      }),
  )
  enginePromise.catch(() => {
    enginePromise = null // 다음 시도에서 다시 받는다
    document.querySelectorAll('script[src*="stellarium-web-engine"]').forEach((el) => el.remove())
  })
  return enginePromise
}

function setupSky(stel) {
  const core = stel.core
  // 휴대폰은 화면 배율을 1.5로 묶어 그리는 양을 줄인다.
  const coarse = window.matchMedia('(pointer: coarse)').matches
  stel.maxDpr = coarse ? 1.5 : 2
  core.stars.addDataSource({ url: asset('/skydata/stars') })
  core.skycultures.addDataSource({ url: asset('/skydata/skycultures/western'), key: 'western' })
  core.milkyway.addDataSource({ url: asset('/skydata/surveys/milkyway') })
  core.landscapes.addDataSource({ url: asset('/skydata/landscapes/guereins'), key: 'guereins' })
  stel.setFont('regular', asset('/engine/Roboto-Regular.ttf'), 1.38)
  stel.setFont('bold', asset('/engine/Roboto-Bold.ttf'), 1.38)

  core.observer.latitude = obsData.latitude * stel.D2R
  core.observer.longitude = obsData.longitude * stel.D2R
  core.observer.elevation = obsData.elevation
  core.observer.utc = stel.date2MJD(obsData.utc)
  core.time_speed = 0

  // 번호 없는 별은 작고 어둡게 둔다. 작품 별은 화면 위에 따로 밝게 그린다.
  core.star_relative_scale = skyTokens.starRelativeScale
  core.star_linear_scale = skyTokens.starLinearScale
  core.bortle_index = skyTokens.bortle
  core.display_limit_mag = skyTokens.limitMag

  // 작품 별 이름과 번호는 화면 위 글자로 따로 그린다. 엔진의 별 이름과 성운, 행성 이름은 끈다.
  core.stars.hints_visible = false
  core.planets.hints_visible = false
  core.dsos.visible = false
  core.cardinals.visible = false
  core.constellations.lines_visible = false
  core.constellations.labels_visible = false
  core.atmosphere.visible = true
  core.landscapes.visible = true
  core.landscapes.fog_visible = false
  core.milkyway.visible = true
  core.planets.visible = false // 달과 행성은 작품 별보다 밝아 끈다
  core.pointer.visible = false
  if (core.meteors) core.meteors.visible = false
  if (core.comets) core.comets.visible = false
  if (core.satellites) core.satellites.visible = false

  // 하늘 빈 곳을 눌러도 다른 별이 선택되지 않게 한다.
  stel.on('click', () => true)
}

// 별 하나의 화면 좌표. 엔진의 입체 투영(stereographic)과 같은 식으로 계산한다.
export function projectObj(stel, obj, width, height) {
  const core = stel.core
  const radec = obj.getInfo('radec')
  const v = stel.convertFrame(core.observer, 'ICRF', 'VIEW', radec)
  const n = Math.hypot(v[0], v[1], v[2])
  const x = v[0] / n
  const y = v[1] / n
  const zz = v[2] / n
  if (zz >= 0.2) return null // 시선 뒤쪽
  const X = (2 * x) / (1 - zz)
  const Y = (2 * y) / (1 - zz)
  const aspect = width / height
  const fov = core.fov
  const fovy = aspect < 1 ? 4 * Math.atan(Math.tan(fov / 4) / aspect) : fov
  const t = 2 * Math.tan(fovy / 4)
  const nx = X / (t * aspect)
  const ny = Y / t
  return { x: ((nx + 1) / 2) * width, y: ((1 - ny) / 2) * height }
}

const norm = (v) => {
  const n = Math.hypot(v[0], v[1], v[2])
  return [v[0] / n, v[1] / n, v[2] / n]
}
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]

// 작품 별 전체를 화면의 남는 자리(헤더와 안내 글 사이)에 꼭 맞게 담는 방향과 시야각.
// 입체 투영 평면에서 별들의 상자를 구해 화면 크기에 맞춘다.
export function fitView(stel, objs, W, H, pad) {
  const core = stel.core
  const dirs = objs.map((o) => norm(stel.convertFrame(core.observer, 'ICRF', 'OBSERVED', o.getInfo('radec'))))
  let c = norm(dirs.reduce((a, d) => [a[0] + d[0], a[1] + d[1], a[2] + d[2]], [0, 0, 0]))
  let out = null
  for (let k = 0; k < 3; k++) {
    const right = norm(cross([0, 0, 1], c))
    const up = norm([-c[2] * c[0], -c[2] * c[1], 1 - c[2] * c[2]]) // 천정 방향을 시선에 수직으로 만든 위쪽
    const pts = dirs.map((d) => {
      const f = 2 / (1 + dot(d, c))
      return [dot(d, right) * f, dot(d, up) * f]
    })
    const xs = pts.map((p) => p[0])
    const ys = pts.map((p) => p[1])
    const minX = Math.min(...xs), maxX = Math.max(...xs)
    const minY = Math.min(...ys), maxY = Math.max(...ys)
    const bw = Math.max(maxX - minX, 1e-3)
    const bh = Math.max(maxY - minY, 1e-3)
    const aw = W - pad.left - pad.right
    const ah = H - pad.top - pad.bottom
    const sPx = Math.min(aw / bw, ah / bh) // 평면 1단위당 화면 픽셀
    const acx = pad.left + aw / 2
    const acy = pad.top + ah / 2
    // 화면 가운데에 와야 할 평면 좌표
    const Xc = (minX + maxX) / 2 + (W / 2 - acx) / sPx
    const Yc = (minY + maxY) / 2 - (H / 2 - acy) / sPx
    const l2 = (Xc * Xc + Yc * Yc) / 4
    const back = [(Xc * (1 / (1 + l2))), (Yc * (1 / (1 + l2))), (1 - l2) / (1 + l2)]
    const nc = norm([
      right[0] * back[0] + up[0] * back[1] + c[0] * back[2],
      right[1] * back[0] + up[1] * back[1] + c[1] * back[2],
      right[2] * back[0] + up[2] * back[1] + c[2] * back[2],
    ])
    const t = H / (2 * sPx)
    const fovy = 4 * Math.atan(t / 2)
    const aspect = W / H
    const fov = aspect < 1 ? 4 * Math.atan(Math.tan(fovy / 4) * aspect) : fovy
    out = { dir: nc, fov }
    c = nc
  }
  return out
}

// 여러 별의 가운데 방향(관측 좌표)과 모두 담기는 시야각
export function viewFor(stel, objs) {
  const core = stel.core
  const sum = [0, 0, 0]
  const dirs = objs.map((o) => {
    const radec = o.getInfo('radec')
    const v = stel.convertFrame(core.observer, 'ICRF', 'OBSERVED', radec)
    const n = Math.hypot(v[0], v[1], v[2])
    const d = [v[0] / n, v[1] / n, v[2] / n]
    sum[0] += d[0]
    sum[1] += d[1]
    sum[2] += d[2]
    return d
  })
  const n = Math.hypot(sum[0], sum[1], sum[2])
  const c = [sum[0] / n, sum[1] / n, sum[2] / n]
  let maxSep = 0
  dirs.forEach((d) => {
    const dot = Math.max(-1, Math.min(1, d[0] * c[0] + d[1] * c[1] + d[2] * c[2]))
    maxSep = Math.max(maxSep, Math.acos(dot))
  })
  return { dir: c, radius: maxSep }
}
