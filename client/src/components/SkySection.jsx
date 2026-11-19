import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { List } from 'lucide-react'
import { works, getWork } from '../data/works.js'
import { site } from '../data/site.js'
import { motion as motionTokens, breakpoints } from '../tokens.js'
import { asset } from '../asset.js'
import { getCanvas, loadEngine, projectObj, fitView } from '../engine/sky.js'
import DetailPanel from './DetailPanel.jsx'
import WorksIndex from './WorksIndex.jsx'

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function SkySection() {
  const [workId, setWorkId] = useState(null)
  const [indexOpen, setIndexOpen] = useState(false)
  const [ready, setReady] = useState(false)
  const [visible, setVisible] = useState(false)
  const [tick, setTick] = useState(0)
  const work = workId ? getWork(workId) : null

  const sectionRef = useRef(null)
  const hostRef = useRef(null)
  const headerRef = useRef(null)
  const stelRef = useRef(null)
  const objsRef = useRef({})
  const markerRefs = useRef({})
  const lineRefs = useRef([])
  const visibleRef = useRef(false)
  const firstRef = useRef(true)
  const openerRef = useRef(null)
  const workIdRef = useRef(null)
  const prevWork = useRef(null)

  const pairs = useMemo(() => works.slice(1).map((w, i) => [works[i].id, w.id]), [])

  // 캔버스 붙이기와 엔진 불러오기. 홈이 먼저 그려진 뒤에 시작한다.
  useEffect(() => {
    const host = hostRef.current
    const canvas = getCanvas()
    host.prepend(canvas)
    let alive = true
    let tries = 0
    const start = window.setTimeout(() => {
      loadEngine().then((stel) => {
        if (!alive) return
        stelRef.current = stel
        stel.paused = !visibleRef.current
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
    }, 500)
    return () => {
      alive = false
      window.clearTimeout(start)
      canvas.remove()
    }
  }, [])

  // 하늘 구간이 보일 때만 엔진이 그린다.
  useEffect(() => {
    const el = sectionRef.current
    const io = new IntersectionObserver(
      ([e]) => {
        visibleRef.current = e.isIntersecting
        setVisible(e.isIntersecting)
        if (stelRef.current) stelRef.current.paused = !e.isIntersecting
      },
      { threshold: 0.15 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // 번호 붙은 별 전체를 지금 하늘 칸에 꼭 맞게 담는다.
  const fit = useCallback((duration) => {
    const stel = stelRef.current
    const host = hostRef.current
    if (!stel || !host) return
    const objs = works.map((w) => objsRef.current[w.id]).filter(Boolean)
    if (!objs.length) return
    const W = host.clientWidth
    const H = host.clientHeight
    const g = Math.max(24, Math.min(72, W * 0.044))
    const small = W < breakpoints.md
    const { dir, fov } = fitView(stel, objs, W, H, {
      top: small ? 96 : 112,
      bottom: small ? 72 : 72,
      left: g + 8,
      right: g + (small ? 36 : 56),
    })
    stel.core.lock = 0
    stel.lookAt(dir, duration)
    stel.zoomTo(Math.min(fov, 175 * stel.D2R), duration)
  }, [])

  useEffect(() => {
    if (!ready) return
    const wide = window.innerWidth >= breakpoints.xl
    if (workId && !wide) return // 좁은 화면은 작품 창이 하늘을 덮는다
    const d = firstRef.current || reduceMotion() ? 0 : motionTokens.skyFit
    firstRef.current = false
    fit(d)
  }, [ready, workId, tick, fit])

  // 창 크기가 바뀌면 하늘 구도를 다시 맞춘다.
  useEffect(() => {
    let timer = 0
    let last = { w: window.innerWidth, h: window.innerHeight }
    const onResize = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        const w = window.innerWidth
        const h = window.innerHeight
        if (w !== last.w || Math.abs(h - last.h) > 120) {
          last = { w, h }
          setTick((t) => t + 1)
        }
      }, 200)
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  // 번호와 선을 매 장면 별 자리에 다시 놓는다.
  useEffect(() => {
    if (!ready) return
    let raf = 0
    const loop = () => {
      const stel = stelRef.current
      const host = hostRef.current
      if (stel && host && visibleRef.current) {
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
      raf = window.requestAnimationFrame(loop)
    }
    raf = window.requestAnimationFrame(loop)
    return () => window.cancelAnimationFrame(raf)
  }, [ready, pairs])

  // 작품 창은 주소를 바꾸지 않는다. 뒤로 가기는 창 닫기로 쓴다.
  const open = useCallback((id, opener) => {
    openerRef.current = opener || null
    setIndexOpen(false)
    if (!workIdRef.current) window.history.pushState({ work: id }, '')
    else window.history.replaceState({ work: id }, '')
    workIdRef.current = id
    setWorkId(id)
  }, [])

  const close = useCallback(() => {
    if (window.history.state && window.history.state.work) window.history.back()
    else {
      workIdRef.current = null
      setWorkId(null)
    }
  }, [])

  useEffect(() => {
    const onPop = (e) => {
      const id = e.state && e.state.work ? e.state.work : null
      workIdRef.current = id
      setWorkId(id)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (prevWork.current && !workId && openerRef.current) openerRef.current.focus({ preventScroll: true })
    prevWork.current = workId
  }, [workId])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (indexOpen) setIndexOpen(false)
      else if (workIdRef.current) close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [indexOpen, close])

  // 작품 창이 하늘 전체를 덮을 때는 뒤쪽 하늘과 머리글에 닿지 않게 한다.
  useEffect(() => {
    const covers = Boolean(workId) && window.innerWidth < breakpoints.xl
    hostRef.current?.toggleAttribute('inert', covers)
    headerRef.current?.toggleAttribute('inert', covers)
  }, [workId, tick])

  const goHome = (e) => {
    e.preventDefault()
    document.getElementById('home')?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <section
      id="sky"
      ref={sectionRef}
      className={`sky${work ? ' has-detail' : ''}${visible ? ' is-visible' : ''}`}
    >
      <div className="sky-host" ref={hostRef} style={{ backgroundImage: `url(${asset('/home-sky.jpg')})` }}>
        <div className="sky-tint" aria-hidden="true" />
        <div className="sky-dim" aria-hidden="true" />
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
          {works.map((w, i) => (
            <button
              key={w.id}
              type="button"
              ref={(el) => (markerRefs.current[w.id] = el)}
              className={`star${workId === w.id ? ' is-active' : ''}`}
              onClick={(e) => open(w.id, e.currentTarget)}
              aria-label={`${w.id} ${w.title || ''} ${w.author}`.replace(/\s+/g, ' ').trim()}
            >
              <span
                className="star-core"
                style={{
                  animationDelay: `-${((i * 0.73) % 3).toFixed(2)}s`,
                  animationDuration: `${(2.6 + ((i * 0.37) % 1.9)).toFixed(2)}s`,
                }}
              />
              <svg className="star-reticle" viewBox="0 0 40 40" aria-hidden="true">
                <path d="M4 12V4h8M28 4h8v8M36 28v8h-8M12 36H4v-8" />
              </svg>
              <span className="star-label">
                <span className="star-num">{w.id}</span>
                <span className="star-name">{w.title || w.author}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <header className="sky-header" ref={headerRef}>
        <a href="#home" className="sky-logo" data-optical="left" onClick={goHome}>{site.title}</a>
        <button type="button" className="btn-raised" onClick={() => setIndexOpen(true)} aria-label="작품 목록" aria-expanded={indexOpen}>
          <List size={20} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </header>

      <DetailPanel work={work} onClose={close} />
      <WorksIndex open={indexOpen} current={work?.id} onClose={() => setIndexOpen(false)} onPick={(id) => open(id, null)} />
    </section>
  )
}
