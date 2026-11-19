import { useEffect, useRef } from 'react'
import HomeSection from './HomeSection.jsx'
import SkySection from './SkySection.jsx'
import { sky as skyTokens } from '../tokens.js'

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

// 스크롤 한 번으로 홈이 눈앞으로 지나가고 하늘 속으로 빨려 들어간다.
// 진행도 p(0 홈, 1 하늘)는 스크롤 위치에서 바로 읽고, 장면마다 투명도와 크기, 카메라 시야각을 p로 정한다.
export default function Journey() {
  const journeyRef = useRef(null)
  const stageRef = useRef(null)
  const progressRef = useRef(0)
  const skyApi = useRef(null)

  useEffect(() => {
    const journey = journeyRef.current
    const stage = stageRef.current
    const calmQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let travel = 1
    let last = -1
    let raf = 0

    const measure = () => {
      travel = Math.max(1, journey.offsetHeight - stage.offsetHeight)
      last = -1
    }
    measure()
    window.addEventListener('resize', measure)

    const set = (k, v) => stage.style.setProperty(k, v)
    const loop = () => {
      const p = clamp(window.scrollY / travel)
      if (p !== last) {
        last = p
        progressRef.current = p
        const calm = calmQuery.matches
        set('--home-o', (1 - smooth(0, 0.55, p)).toFixed(3))
        set('--home-s', calm ? '1' : (1 + 1.7 * smooth(0, 0.7, p)).toFixed(3))
        set('--sky-o', smooth(0.05, 0.45, p).toFixed(3))
        set('--ui-o', smooth(0.7, 1, p).toFixed(3))
        // 날아가는 동안에는 하늘이 밝고, 도착하면 번호 없는 별이 어두워지며 작품 별만 남는다.
        set('--dim-o', (0.18 + (skyTokens.dimOpacity - 0.18) * smooth(0.55, 1, p)).toFixed(3))
        stage.classList.toggle('is-top', p < 0.03)
        stage.classList.toggle('is-away', p > 0.62)
        stage.classList.toggle('is-arrived', p > 0.985)
        // 카메라는 엔진이 그리기 전에 먼저 맞춘다(같은 프레임에서 별과 번호가 어긋나지 않게).
        skyApi.current?.applyProgress(p)
      }
      raf = window.requestAnimationFrame(loop)
    }
    raf = window.requestAnimationFrame(loop)
    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
    }
  }, [])

  return (
    <main className="journey" ref={journeyRef}>
      <div className="stage is-top" ref={stageRef}>
        <SkySection progressRef={progressRef} apiRef={skyApi} />
        <HomeSection />
      </div>
      <span className="snap snap-top" aria-hidden="true" />
      <span className="snap snap-sky" aria-hidden="true" />
    </main>
  )
}
