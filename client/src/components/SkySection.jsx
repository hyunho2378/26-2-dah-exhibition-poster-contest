import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { works, getWork } from '../data/works.js'
import { site } from '../data/site.js'
import { motion as motionTokens, breakpoints } from '../tokens.js'
import { asset } from '../asset.js'
import { goHome } from '../journey.js'
import { useAwardsOpen } from '../awards.js'
import { runMeteors } from '../fx/meteor.js'
import { getCanvas, loadEngine, projectObj, fitView } from '../engine/sky.js'
import DetailPanel from './DetailPanel.jsx'

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)
const WARP_FOV = 160 // 여정이 시작될 때 카메라가 보는 하늘 폭(도)

export default function SkySection({ progressRef, apiRef }) {
  const [workId, setWorkId] = useState(null)
  const [ready, setReady] = useState(false)
  const [visible, setVisible] = useState(false)
  const [tick, setTick] = useState(0)
  const [hoverId, setHoverId] = useState(null)
  const [light, setLight] = useState(false)
  const work = workId ? getWork(workId) : null
  const awardsOn = useAwardsOpen()
  const awardsOnRef = useRef(false)
  const [lit, setLit] = useState(false) // 수상작만 빛을 켜는 보기
  const litRef = useRef(false)

  const skyRef = useRef(null)
  const hostRef = useRef(null)
  const meteorsRef = useRef(null)
  const headerRef = useRef(null)
  const stelRef = useRef(null)
  const readyRef = useRef(false)
  const objsRef = useRef({})
  const markerRefs = useRef({})
  const lineRefs = useRef([])
  const fitCache = useRef(null)
  const visibleRef = useRef(false)
  const arrivedRef = useRef(false)
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
        stel.paused = !visibleRef.current || awardsOnRef.current
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
          if (missing === 0 || tries > 60) {
            readyRef.current = true
            setReady(true)
          } else window.setTimeout(find, 200)
        }
        find()
      }).catch(() => {
        // 엔진을 못 불러와도 여정이 하늘 앞에서 갇히지 않게 준비된 것으로 본다.
        if (!alive) return
        readyRef.current = true
        setReady(true)
      })
    }, 120)
    return () => {
      alive = false
      window.clearTimeout(start)
      canvas.remove()
    }
  }, [])

  // 번호 붙은 별 전체를 지금 하늘 칸에 꼭 맞게 담는 방향과 시야각
  const computeFit = useCallback(() => {
    const stel = stelRef.current
    const host = hostRef.current
    if (!stel || !host || !readyRef.current) return null
    const W = host.clientWidth
    const H = host.clientHeight
    const c = fitCache.current
    if (c && c.W === W && c.H === H) return c
    const objs = works.map((w) => objsRef.current[w.id]).filter(Boolean)
    if (!objs.length || !W || !H) return null
    const g = Math.max(24, Math.min(72, W * 0.044))
    const small = W < breakpoints.md
    const { dir, fov } = fitView(stel, objs, W, H, {
      top: small ? 96 : 112,
      bottom: 72,
      left: g + 8,
      right: g + (small ? 36 : 56),
    })
    fitCache.current = { W, H, dir, fov: Math.min(fov, 175 * stel.D2R) }
    return fitCache.current
  }, [])

  const fit = useCallback(
    (duration) => {
      const stel = stelRef.current
      const f = computeFit()
      if (!stel || !f) return
      stel.core.lock = 0
      stel.lookAt(f.dir, duration)
      stel.zoomTo(f.fov, duration)
    },
    [computeFit],
  )

  // 여정 진행도 p에 맞춰 카메라를 정한다. p가 0에 가까울수록 넓게 보고, 1에서 별자리 전체에 딱 맞는다.
  // 여정 안에서는 시야각이 줄어들며 별이 사방으로 퍼져 나가 앞으로 빨려 들어가는 느낌이 난다.
  const applyProgress = useCallback(
    (p) => {
      const on = p > 0.04
      if (visibleRef.current !== on) {
        visibleRef.current = on
        setVisible(on)
        if (stelRef.current) stelRef.current.paused = !on || awardsOnRef.current
      }
      const stel = stelRef.current
      const f = computeFit()
      if (!stel || !f) return
      if (p >= 0.999) {
        if (!arrivedRef.current) {
          arrivedRef.current = true
          stel.core.lock = 0
          stel.lookAt(f.dir, 0)
          stel.zoomTo(f.fov, 0)
        }
        return
      }
      arrivedRef.current = false
      const e = reduceMotion() ? 1 : easeOutCubic(clamp((p - 0.05) / 0.95))
      const wide = WARP_FOV * stel.D2R
      const fov = Math.exp(Math.log(wide) + (Math.log(f.fov) - Math.log(wide)) * e)
      stel.core.lock = 0
      stel.lookAt(f.dir, 0)
      stel.zoomTo(Math.min(fov, 175 * stel.D2R), 0)
    },
    [computeFit],
  )

  useImperativeHandle(apiRef, () => ({ applyProgress, isReady: () => readyRef.current }), [applyProgress])

  // 엔진이 준비되면 지금 진행도에 맞춰 한 번 맞춘다.
  useEffect(() => {
    if (!ready) return
    arrivedRef.current = false
    applyProgress(progressRef.current)
  }, [ready, applyProgress, progressRef])

  // 하늘에 도착한 뒤 작품 창이 열리고 닫히거나 창 크기가 바뀌면 하늘이 자리를 옮긴다.
  useEffect(() => {
    if (!ready) return
    if (progressRef.current < 0.999) return
    const wide = window.innerWidth >= breakpoints.xl
    if (workId && !wide) return // 좁은 화면은 작품 창이 하늘을 덮는다
    fit(reduceMotion() ? 0 : motionTokens.skyFit)
  }, [ready, workId, tick, fit, progressRef])

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
          fitCache.current = null
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

  // 하늘에 도착하면 몇 초에 한 번 별똥별이 지나간다.
  useEffect(() => {
    if (!ready) return undefined
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)')
    return runMeteors(meteorsRef.current, () => progressRef.current > 0.985 && !document.hidden && !calm.matches, 3200)
  }, [ready, progressRef])

  // 마우스를 쓰는 화면에서는 커서 둘레만 어둠이 걷혀 가려진 별이 비친다.
  useEffect(() => {
    const sky = skyRef.current
    const host = hostRef.current
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!fine.matches || calm.matches) return undefined
    setLight(true)
    let raf = 0
    let x = -999
    let y = -999
    const paint = () => {
      raf = 0
      sky.style.setProperty('--mx', `${x}px`)
      sky.style.setProperty('--my', `${y}px`)
    }
    const queue = () => {
      if (!raf) raf = window.requestAnimationFrame(paint)
    }
    const onMove = (e) => {
      const r = host.getBoundingClientRect()
      x = e.clientX - r.left
      y = e.clientY - r.top
      queue()
    }
    const onLeave = () => {
      x = -999
      y = -999
      queue()
    }
    host.addEventListener('pointermove', onMove)
    host.addEventListener('pointerleave', onLeave)
    return () => {
      window.cancelAnimationFrame(raf)
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerleave', onLeave)
      setLight(false)
    }
  }, [])

  // 별을 누르면 그 자리에서 빛의 파문이 퍼진다.
  const ripple = (btn) => {
    if (reduceMotion() || !btn) return
    const ns = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(ns, 'svg')
    svg.setAttribute('class', 'star-ring')
    svg.setAttribute('viewBox', '0 0 40 40')
    const c = document.createElementNS(ns, 'circle')
    c.setAttribute('cx', '20')
    c.setAttribute('cy', '20')
    c.setAttribute('r', '19')
    svg.appendChild(c)
    svg.addEventListener('animationend', () => svg.remove())
    btn.appendChild(svg)
  }

  // 수상작 보기: 켜면 수상작 별만 밝아지고 나머지는 어두워진다. 켜는 순간 수상작 별에서 빛의 파문이 차례로 퍼진다.
  const toggleLit = useCallback(() => {
    const next = !litRef.current
    litRef.current = next
    setLit(next)
    if (next) {
      works
        .filter((w) => w.award)
        .forEach((w, i) => window.setTimeout(() => ripple(markerRefs.current[w.id]), 120 + i * 140))
    }
  }, [])

  // 작품 창은 주소를 바꾸지 않는다. 뒤로 가기는 창 닫기로 쓴다.
  const open = useCallback((id, opener) => {
    openerRef.current = opener || null
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

  // 키보드: 방향키(위아래, 양옆)로 이전과 다음 작품, Esc로 닫기
  useEffect(() => {
    const onKey = (e) => {
      if (document.documentElement.classList.contains('is-awards')) return // 수상 페이지가 열려 있으면 그쪽이 키를 쓴다
      if (e.key === 'Escape') {
        if (workIdRef.current) close()
        else if (litRef.current) toggleLit()
        return
      }
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
      if (progressRef.current < 0.985) return // 하늘에 도착하기 전에는 페이지 스크롤로 둔다
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      e.preventDefault()
      const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
      const ids = (litRef.current ? works.filter((w) => w.award) : works).map((w) => w.id)
      let cur = workIdRef.current ? ids.indexOf(workIdRef.current) : -1
      if (cur < 0) cur = dir > 0 ? -1 : 0
      open(ids[(cur + dir + ids.length) % ids.length], null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close, open, progressRef, toggleLit])

  // 작품 창이 열려 있는 동안에는 페이지가 스크롤되지 않는다.
  useEffect(() => {
    const locked = Boolean(workId)
    document.documentElement.classList.toggle('is-locked', locked)
    return () => document.documentElement.classList.remove('is-locked')
  }, [workId])

  // 작품 창이 하늘 전체를 덮을 때는 뒤쪽 하늘과 머리글에 닿지 않게 한다.
  useEffect(() => {
    const covers = Boolean(workId) && window.innerWidth < breakpoints.xl
    hostRef.current?.toggleAttribute('inert', covers)
    headerRef.current?.toggleAttribute('inert', covers)
  }, [workId, tick])

  const back = (e) => {
    e.preventDefault()
    goHome()
  }

  // 수상 페이지가 덮고 있는 동안에는 하늘 그리기를 멈춘다.
  useEffect(() => {
    awardsOnRef.current = awardsOn
    const stel = stelRef.current
    if (stel) stel.paused = awardsOn || !visibleRef.current
  }, [awardsOn])

  return (
    <div id="sky" ref={skyRef} className={`sky${work ? ' has-detail' : ''}${visible ? ' is-visible' : ''}${light ? ' has-light' : ''}${lit ? ' show-awards' : ''}`}>
      <div className="sky-host" ref={hostRef} style={{ backgroundImage: `url(${asset('/home-sky.jpg')})` }}>
        <div className="sky-tint" aria-hidden="true" />
        <div className="sky-dim" aria-hidden="true" />
        <div className="sky-veil" aria-hidden="true" />
        <div className="meteors" ref={meteorsRef} aria-hidden="true" />
        <svg className="sky-lines" aria-hidden="true">
          {pairs.map(([a, b], i) => (
            <line
              key={`${a}-${b}`}
              ref={(el) => (lineRefs.current[i] = el)}
              style={{ '--i': i }}
              className={`${work && (work.id === a || work.id === b) ? 'is-on' : ''}${hoverId && (hoverId === a || hoverId === b) ? ' is-hot' : ''}`}
            />
          ))}
        </svg>
        <div className="sky-markers">
          {works.map((w, i) => (
            <button
              key={w.id}
              type="button"
              ref={(el) => (markerRefs.current[w.id] = el)}
              className={`star${workId === w.id ? ' is-active' : ''}${w.award ? ' is-award' : ''}`}
              data-award={w.award || undefined}
              style={{ '--i': i }}
              onPointerEnter={() => setHoverId(w.id)}
              onPointerLeave={() => setHoverId(null)}
              onClick={(e) => {
                ripple(e.currentTarget)
                open(w.id, e.currentTarget)
              }}
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
        <div className="sky-nav">
          <a href="#home" className="sky-logo" data-optical="left" onClick={back}>{site.title}</a>
          <button type="button" className="sky-awards" data-optical="left" aria-pressed={lit} onClick={toggleLit}>
            {site.awardsLink}
          </button>
        </div>
      </header>

      <DetailPanel work={work} onClose={close} />
    </div>
  )
}
