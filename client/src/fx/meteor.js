// 별똥별: 한 줄짜리 빛이 하늘을 비스듬히 가로지른다. 투명도와 위치 이동만 쓴다.
const rand = (a, b) => a + Math.random() * (b - a)

export function spawnMeteor(layer) {
  if (!layer) return
  const W = layer.clientWidth
  const H = layer.clientHeight
  if (!W || !H) return
  const ang = rand(18, 34)
  const rad = (ang * Math.PI) / 180
  const len = rand(120, 210)
  const dist = rand(0.45, 0.85) * Math.min(W * 1.1, 1200)
  const m = document.createElement('span')
  m.className = 'meteor'
  const set = (k, v) => m.style.setProperty(k, v)
  set('--len', `${len.toFixed(0)}px`)
  set('--x', `${(rand(0.05, 0.7) * W).toFixed(0)}px`)
  set('--y', `${(rand(-0.02, 0.38) * H).toFixed(0)}px`)
  set('--dx', `${(Math.cos(rad) * dist).toFixed(0)}px`)
  set('--dy', `${(Math.sin(rad) * dist).toFixed(0)}px`)
  set('--a', `${ang.toFixed(1)}deg`)
  set('--t', `${rand(0.9, 1.5).toFixed(2)}s`)
  m.addEventListener('animationend', () => m.remove())
  layer.appendChild(m)
}

// ok()가 참일 때만 몇 초에 한 번씩 별똥별을 띄운다. 멈추려면 돌려받은 함수를 부른다.
export function runMeteors(layer, ok, firstDelay = 1400) {
  let timer = 0
  const next = (delay) => {
    timer = window.setTimeout(() => {
      if (ok()) spawnMeteor(layer)
      next(rand(4500, 9500))
    }, delay)
  }
  next(firstDelay)
  return () => window.clearTimeout(timer)
}
