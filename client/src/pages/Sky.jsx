import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { List } from 'lucide-react'
import { works, getWork, getAdjacent } from '../data/works.js'
import { site } from '../data/site.js'
import { motion as motionTokens, breakpoints } from '../tokens.js'
import { getCanvas, loadEngine, projectObj, fitView } from '../engine/sky.js'
import WorkPanel from '../components/WorkPanel.jsx'
import WorksIndex from '../components/WorksIndex.jsx'

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const isWide = () => window.innerWidth >= breakpoints.lg

export default function Sky() {
  const { id } = useParams()
  const navigate = useNavigate()
  const work = id ? getWork(id) : null

  const hostRef = useRef(null)
  const stelRef = useRef(null)
  const objsRef = useRef({})
  const markerRefs = useRef({})
  const lineRefs = useRef([])
  const firstMoveRef = useRef(true)
  const [ready, setReady] = useState(false)
  const [indexOpen, setIndexOpen] = useState(false)
  const [touched, setTouched] = useState(false)

  const pairs = useMemo(() => works.slice(1).map((w, i) => [works[i].id, w.id]), [])

  // 캔버스 붙이기와 엔진 불러오기
  useEffect(() => {
    const host = hostRef.current
    const canvas = getCanvas()
    document.documentElement.classList.add('is-sky')
    host.prepend(canvas)
    let alive = true
    let tries = 0
    loadEngine().then((stel) => {
      if (!alive) return
      stel.paused = false
      stelRef.current = stel
      const find = () => {
        if (!alive) return
        let missing = 0
        works.forEach((w) => {
          if (!objsRef.current[w.id]) {
            const o = stel.getObj(w.star)
            if (o) objsRef.current[w.id] = o
            else missing += 1
          }
        })
        tries += 1
        if (missing === 0 || tries > 60) setReady(true)
        else window.setTimeout(find, 200)
      }
      find()
    })
    return () => {
      alive = false
      if (stelRef.current) stelRef.current.paused = true
      canvas.remove()
      document.documentElement.classList.remove('is-sky')
    }
  }, [])

  // 전체 보기와 작품 별로 다가가기
  const overview = useCallback((duration) => {
    const stel = stelRef.current
    const objs = works.map((w) => objsRef.current[w.id]).filter(Boolean)
    if (!stel || objs.length === 0) return
    const host = hostRef.current
    const W = host.clientWidth
    const H = host.clientHeight
    const small = W < breakpoints.md
    const { dir, fov } = fitView(stel, objs, W, H, {
      top: small ? 96 : 104,
      bottom: small ? 112 : 128,
      left: small ? 28 : 64,
      right: small ? 76 : 120,
    })
    stel.core.lock = 0
    stel.lookAt(dir, duration)
    stel.zoomTo(Math.min(fov, 175 * stel.D2R), duration)
  }, [])

  useEffect(() => {
    if (!ready) return
    const stel = stelRef.current
    const d = firstMoveRef.current || reduceMotion() ? 0 : motionTokens.skyMove
    firstMoveRef.current = false
    if (work && objsRef.current[work.id]) {
      stel.pointAndLock(objsRef.current[work.id], d)
      stel.zoomTo(48 * stel.D2R, d)
    } else {
      overview(d)
    }
  }, [ready, work, overview])

  // 별 위 번호와 선을 매 장면 다시 놓는다.
  useEffect(() => {
    if (!ready) return
    let raf = 0
    const tick = () => {
      const stel = stelRef.current
      const host = hostRef.current
      if (stel && host) {
        const W = host.clientWidth
        const H = host.clientHeight
        const pos = {}
        works.forEach((w) => {
          const o = objsRef.current[w.id]
          const el = markerRefs.current[w.id]
          if (!o || !el) return
          const p = projectObj(stel, o, W, H)
          const on = p && p.x > -40 && p.x < W + 40 && p.y > -40 && p.y < H + 40
          pos[w.id] = on ? p : null
          if (on) {
            el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`
            el.style.visibility = 'visible'
          } else {
            el.style.visibility = 'hidden'
          }
        })
        pairs.forEach(([a, b], i) => {
          const ln = lineRefs.current[i]
          if (!ln) return
          const pa = pos[a]
          const pb = pos[b]
          if (pa && pb) {
            ln.setAttribute('x1', pa.x)
            ln.setAttribute('y1', pa.y)
            ln.setAttribute('x2', pb.x)
            ln.setAttribute('y2', pb.y)
            ln.style.visibility = 'visible'
          } else {
            ln.style.visibility = 'hidden'
          }
        })
      }
      raf = window.requestAnimationFrame(tick)
    }
    raf = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(raf)
  }, [ready, pairs])

  useEffect(() => {
    document.title = work
      ? `${work.id} ${work.title || work.author}, ${site.title}`
      : `하늘, ${site.title}`
  }, [work])

  // 키보드: Esc 닫기, 좌우 화살표로 이전과 다음 작품
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (indexOpen) setIndexOpen(false)
        else if (work) navigate('/sky')
      }
      if (!work || indexOpen) return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const { prev, next } = getAdjacent(work.id)
      if (e.key === 'ArrowRight') navigate(`/sky/${next.id}`)
      if (e.key === 'ArrowLeft') navigate(`/sky/${prev.id}`)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [work, indexOpen, navigate])

  const open = (wid) => {
    setTouched(true)
    setIndexOpen(false)
    navigate(`/sky/${wid}`)
  }

  return (
    <div className={`sky${work ? ' has-panel' : ''}`}>
      <div className="sky-host" ref={hostRef} onPointerDown={() => setTouched(true)}>
        <div className="sky-tint" aria-hidden="true" />
        <svg className="sky-lines" aria-hidden="true">
          {pairs.map(([a, b], i) => (
            <line
              key={`${a}-${b}`}
              ref={(el) => (lineRefs.current[i] = el)}
              className={work && (work.id === a || work.id === b) ? 'is-on' : ''}
            />
          ))}
        </svg>
        <div className="sky-markers">
          {works.map((w) => (
            <button
              key={w.id}
              type="button"
              ref={(el) => (markerRefs.current[w.id] = el)}
              className={`star${work?.id === w.id ? ' is-active' : ''}`}
              onClick={() => open(w.id)}
              aria-label={`${w.id} ${w.title || ''} ${w.author}`.replace(/\s+/g, ' ').trim()}
            >
              <span className="star-core" aria-hidden="true" />
              <svg className="star-reticle" viewBox="0 0 40 40" aria-hidden="true">
                <path d="M4 12V4h8M28 4h8v8M36 28v8h-8M12 36H4v-8" />
              </svg>
              <span className="star-num">{w.id}</span>
              <span className="star-name">{w.title || w.author}</span>
            </button>
          ))}
        </div>
        {!ready ? <p className="sky-loading">밤하늘을 여는 중</p> : null}
      </div>

      <header className="sky-header">
        <Link to="/" className="sky-logo" data-optical="left">{site.title}</Link>
        <button type="button" className="sky-index-btn" onClick={() => setIndexOpen(true)} aria-expanded={indexOpen}>
          <List size={20} strokeWidth={1.5} aria-hidden="true" />
          <span>작품 목록</span>
        </button>
      </header>

      {ready && !work && !touched ? (
        <p className="sky-hint">번호가 붙은 별을 누르면 작품이 열립니다.</p>
      ) : null}

      <WorkPanel work={work} focusOnOpen={touched} onClose={() => navigate('/sky')} />
      <WorksIndex open={indexOpen} current={work?.id} onClose={() => setIndexOpen(false)} onPick={open} />
    </div>
  )
}
