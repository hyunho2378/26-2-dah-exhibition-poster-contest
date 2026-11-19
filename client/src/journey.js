// 홈에서 하늘로 가는 여정(스크롤 길이)을 다루는 도우미.
const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function travelPx() {
  const j = document.querySelector('.journey')
  const s = document.querySelector('.stage')
  return j && s ? Math.max(1, j.offsetHeight - s.offsetHeight) : window.innerHeight
}

export function goSky() {
  window.scrollTo({ top: travelPx(), behavior: reduce() ? 'auto' : 'smooth' })
}

export function goHome() {
  window.scrollTo({ top: 0, behavior: reduce() ? 'auto' : 'smooth' })
}
