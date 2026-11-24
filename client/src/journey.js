// 홈에서 하늘로 가는 여정(스크롤 길이)을 다룬다.
// 브라우저의 스크롤 고정(scroll-snap)에 맡기지 않고, 한 번 밀면 끝까지 날아가고 중간에 멈춰 서지 않게 직접 움직인다.
// 하늘이 아직 준비되지 않았으면 별이 흐르기 시작한 채로 기다렸다가 준비되면 마저 날아간다(빈 하늘이 먼저 나오지 않게).
const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const sleep = (ms) => new Promise((r) => window.setTimeout(r, ms))
const html = () => document.documentElement
const EDGE = 6 // 맨 위, 맨 아래로 보는 여유(px)
const PRE = 0.1 // 하늘을 기다리는 동안 머무는 진행도
const WAIT_MAX = 12000 // 하늘을 기다리는 가장 긴 시간(ms)
const COOL = 350 // 이동이 끝난 뒤 관성 입력을 무시하는 시간(ms)

const st = { flying: false, waiting: false, sky: false, token: 0, intent: 0, cool: 0, lastY: 0, dir: 1, settle: 0, isReady: () => true }

export function travelPx() {
  const j = document.querySelector('.journey')
  const s = document.querySelector('.stage')
  return j && s ? Math.max(1, j.offsetHeight - s.offsetHeight) : window.innerHeight
}

// 작품 창과 수상 페이지가 열려 있으면 페이지 스크롤은 잠겨 있고, 그 안의 스크롤이 먼저다.
const overlayOpen = () => html().classList.contains('is-locked') || html().classList.contains('is-awards')

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

function tween(toY, ms) {
  const token = ++st.token
  const from = window.scrollY
  if (reduce() || ms <= 0 || Math.abs(toY - from) < 2) {
    window.scrollTo(0, toY)
    st.flying = false
    html().classList.remove('is-flying')
    return Promise.resolve()
  }
  st.flying = true
  html().classList.add('is-flying')
  const t0 = performance.now()
  return new Promise((resolve) => {
    const step = (now) => {
      if (token !== st.token) return resolve() // 다른 이동이 이어받았다
      const t = clamp((now - t0) / ms)
      window.scrollTo(0, from + (toY - from) * ease(t))
      if (t < 1) window.requestAnimationFrame(step)
      else {
        st.flying = false
        html().classList.remove('is-flying')
        st.cool = performance.now() + COOL
        resolve()
      }
    }
    window.requestAnimationFrame(step)
  })
}

async function run(target, mine) {
  const travel = travelPx()
  if (target === 1 && !st.isReady()) {
    await tween(PRE * travel, 900)
    const t0 = performance.now()
    st.waiting = true
    while (!st.isReady() && performance.now() - t0 < WAIT_MAX && mine === st.intent) await sleep(100)
    st.waiting = false
    if (mine !== st.intent) return
  }
  const to = target * travel
  const dist = Math.abs(to - window.scrollY) / travel
  await tween(to, Math.round(500 + 1500 * dist))
}

// target 1은 하늘, 0은 홈
export function fly(target) {
  st.intent += 1
  return run(target, st.intent)
}

export const goSky = () => fly(1)
export const goHome = () => fly(0)

// 입력을 읽어 여정을 움직인다. 반환값은 해제 함수.
export function initJourney({ isReady }) {
  st.isReady = isReady || (() => true)
  st.lastY = window.scrollY

  const busy = () => st.flying || performance.now() < st.cool

  const onWheel = (e) => {
    if (e.ctrlKey || overlayOpen()) return
    const dy = e.deltaY
    if (Math.abs(dy) < 1 || Math.abs(dy) < Math.abs(e.deltaX)) return
    if (busy()) {
      e.preventDefault()
      return
    }
    const y = window.scrollY
    const travel = travelPx()
    if (y < EDGE && dy > 0) {
      e.preventDefault()
      fly(1)
    } else if (y > travel - EDGE && dy < 0) {
      e.preventDefault()
      fly(0)
    } else if (y >= EDGE && y <= travel - EDGE) {
      e.preventDefault()
      fly(dy > 0 ? 1 : 0)
    }
  }

  let ty = null
  let tx = 0
  let handled = false
  const onTouchStart = (e) => {
    if (overlayOpen() || e.touches.length !== 1) {
      ty = null
      return
    }
    ty = e.touches[0].clientY
    tx = e.touches[0].clientX
    handled = false
  }
  const onTouchMove = (e) => {
    if (ty === null || overlayOpen()) return
    if (busy() || handled) {
      if (e.cancelable) e.preventDefault()
      return
    }
    const dy = ty - e.touches[0].clientY
    const dx = tx - e.touches[0].clientX
    if (Math.abs(dx) > Math.abs(dy)) return
    const y = window.scrollY
    const travel = travelPx()
    // 손가락을 위로 밀면(dy > 0) 하늘로, 아래로 밀면 홈으로. 하늘에서 별을 누르다 살짝 밀린 정도로는 돌아가지 않는다.
    if (dy > 4 && y < travel - EDGE) {
      if (e.cancelable) e.preventDefault()
      handled = true
      fly(1)
    } else if (dy < -36 && y > EDGE) {
      if (e.cancelable) e.preventDefault()
      handled = true
      fly(0)
    }
  }

  const onKey = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || overlayOpen()) return
    const tag = document.activeElement?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    const y = window.scrollY
    const travel = travelPx()
    const onButton = tag === 'BUTTON' || tag === 'A'
    let to = null
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'End' || (e.key === ' ' && !e.shiftKey && !onButton)) to = 1
    else if (e.key === 'PageUp' || e.key === 'Home' || (e.key === ' ' && e.shiftKey && !onButton)) to = 0
    else if (e.key === 'ArrowUp' && y >= EDGE && y <= travel - EDGE) to = 0
    if (to === null) return
    if (to === 1 && y > travel - EDGE) return
    if (to === 0 && y < EDGE) return
    e.preventDefault()
    if (!busy()) fly(to)
  }

  // 스크롤바를 끌거나 다른 방법으로 중간에 멈추면, 마지막으로 움직인 방향대로 마저 간다.
  const onScroll = () => {
    const y = window.scrollY
    const t = travelPx()
    if (y >= t - EDGE) st.sky = true
    else if (y <= EDGE) st.sky = false
    if (y !== st.lastY) st.dir = y > st.lastY ? 1 : -1
    st.lastY = y
    if (st.flying) return
    window.clearTimeout(st.settle)
    st.settle = window.setTimeout(() => {
      if (st.flying || overlayOpen()) return
      const y2 = window.scrollY
      if (y2 >= EDGE && y2 <= travelPx() - EDGE) fly(st.dir)
    }, 160)
  }

  // 화면 크기나 방향이 바뀌어 여정 길이가 달라지면, 하늘에 있던 사람은 새 길이의 끝에 다시 놓는다.
  const onResize = () => {
    window.setTimeout(() => {
      if (st.sky && !st.flying && !overlayOpen()) window.scrollTo(0, travelPx())
    }, 120)
  }

  // 안전장치: 어떤 이유로든 중간에서 멈춰 있으면(하늘을 기다리는 중과 이동 중은 제외) 가던 방향으로 마저 보낸다.
  let seenY = -1
  const watchdog = window.setInterval(() => {
    if (st.flying || st.waiting || overlayOpen() || document.hidden) {
      seenY = -1
      return
    }
    const y = window.scrollY
    const mid = y >= EDGE && y <= travelPx() - EDGE
    if (mid && Math.abs(y - seenY) < 1) fly(st.dir)
    seenY = mid ? y : -1
  }, 700)

  window.addEventListener('resize', onResize)
  window.addEventListener('wheel', onWheel, { passive: false })
  window.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchmove', onTouchMove, { passive: false })
  window.addEventListener('keydown', onKey)
  window.addEventListener('scroll', onScroll, { passive: true })
  return () => {
    window.removeEventListener('wheel', onWheel)
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('keydown', onKey)
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onResize)
    window.clearInterval(watchdog)
    window.clearTimeout(st.settle)
    html().classList.remove('is-flying')
  }
}
