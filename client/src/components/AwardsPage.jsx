import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { awardGroups } from '../data/works.js'
import { site } from '../data/site.js'
import { asset } from '../asset.js'
import { closeAwards, useAwardsOpen } from '../awards.js'
import DetailPanel from './DetailPanel.jsx'
import TitleText from './TitleText.jsx'

const ARROWS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']

function Card({ work, grand, eager, onOpen }) {
  const alt = `${work.author}, ${work.title || '작품'}`
  return (
    <li className={`award-item${grand ? ' is-grand' : ''}`}>
      <button type="button" className="award-card" onClick={(e) => onOpen(work.id, e.currentTarget)} aria-label={`${work.title || work.author}, ${work.author}`}>
        <span className="award-poster">
          <img src={work.full} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" width="1414" height="2000" />
        </span>
        <span className="award-info" data-optical={grand ? 'top' : undefined}>
          <span className="award-title" data-optical={grand ? 'left' : undefined}>
            <TitleText text={work.title || work.author} stack />
          </span>
          <span className="award-author">{work.author}</span>
          <span className="award-meta">
            <span>{work.studentId}</span>
            <span>{work.department}</span>
          </span>
        </span>
      </button>
    </li>
  )
}

// 수상작 페이지: 최우수상, 우수상, 장려상 순서로 포스터를 보여 주고, 포스터를 누르면 작품 창이 열린다.
export default function AwardsPage() {
  const open = useAwardsOpen()
  const [workId, setWorkId] = useState(null)
  const [seen, setSeen] = useState(open)
  const rootRef = useRef(null)
  const scrollRef = useRef(null)
  const mainRef = useRef(null)
  const closeRef = useRef(null)
  const openerRef = useRef(null)
  const workIdRef = useRef(null)

  const flat = useMemo(() => awardGroups.flatMap((g) => g.works), [])
  const work = workId ? flat.find((w) => w.id === workId) ?? null : null

  const openWork = useCallback((id, opener) => {
    if (opener) openerRef.current = opener
    workIdRef.current = id
    setWorkId(id)
  }, [])

  const closeWork = useCallback(() => {
    workIdRef.current = null
    setWorkId(null)
  }, [])

  // 열릴 때: 맨 위에서 시작하고 뒤쪽 화면은 잠근다. 닫힐 때: 작품 창도 함께 닫는다.
  useEffect(() => {
    const root = rootRef.current
    root.toggleAttribute('inert', !open)
    document.documentElement.classList.toggle('is-awards', open)
    let prevTitle
    if (open) {
      setSeen(true)
      if (scrollRef.current) scrollRef.current.scrollTop = 0
      closeRef.current?.focus({ preventScroll: true, focusVisible: false })
      prevTitle = document.title
      document.title = `수상작, ${site.title}`
    } else {
      workIdRef.current = null
      setWorkId(null)
    }
    return () => {
      document.documentElement.classList.remove('is-awards')
      if (prevTitle !== undefined) document.title = prevTitle
    }
  }, [open])

  // 작품 창이 열리면 뒤쪽 수상작 목록은 잠그고, 닫히면 열었던 포스터로 초점을 돌려준다.
  const hadWork = useRef(false)
  useEffect(() => {
    mainRef.current?.toggleAttribute('inert', Boolean(work))
    if (hadWork.current && !work && open) openerRef.current?.focus({ preventScroll: true })
    hadWork.current = Boolean(work)
  }, [work, open])

  // 키보드: 작품 창이 열려 있으면 방향키로 이전과 다음 수상작, Esc는 작품 창을 닫고 한 번 더 누르면 페이지를 닫는다.
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (workIdRef.current) closeWork()
        else closeAwards()
        return
      }
      if (!workIdRef.current || !ARROWS.includes(e.key)) return
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
      e.preventDefault()
      const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
      const i = flat.findIndex((w) => w.id === workIdRef.current)
      openWork(flat[(i + dir + flat.length) % flat.length].id, null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, flat, openWork, closeWork])

  return (
    <section ref={rootRef} className={`awards${open ? ' is-open' : ''}${work ? ' has-detail' : ''}`} aria-label="수상작" aria-hidden={!open}>
      <div className="awards-scroll" ref={scrollRef}>
        <div className="awards-bg" style={{ backgroundImage: `url(${asset('/home-sky.jpg')})` }} aria-hidden="true" />
        <div className="awards-main" ref={mainRef}>
          <header className="awards-header">
            <a href="#home" className="awards-logo" data-optical="left" onClick={(e) => { e.preventDefault(); closeAwards() }}>
              {site.title}
            </a>
          </header>

          <div className="awards-hero">
            <h1 className={`awards-title${open ? ' rise' : ''}`} style={{ '--i': 0 }} data-optical="left">AWARDS</h1>
            <p className={`awards-sub${open ? ' rise' : ''}`} style={{ '--i': 1 }} data-optical="left">
              <span className="phrase">{site.term} 디지털인문예술전공</span>{' '}
              <span className="phrase">프로젝트 전시회 포스터 공모전 수상작</span>
            </p>
          </div>

          {seen
            ? awardGroups.map((g, gi) => (
                <div key={g.key} className={`award-group is-${g.key}${open ? ' rise' : ''}`} style={{ '--i': gi + 2 }}>
                  <div className="award-label">
                    <h2 className="award-name" data-optical="left">{g.name}</h2>
                  </div>
                  <ul className="award-list">
                    {g.works.map((w) => (
                      <Card key={w.id} work={w} grand={g.key === 'grand'} eager={gi === 0} onOpen={openWork} />
                    ))}
                  </ul>
                </div>
              ))
            : null}
        </div>
      </div>

      <div className="awards-fade" aria-hidden="true" />
      <div className="awards-bar">
        <button type="button" ref={closeRef} className="btn-raised" onClick={closeAwards} aria-label="닫기">
          <X size={20} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>

      <button type="button" className="awards-scrim" tabIndex={-1} aria-label="작품 창 닫기" onClick={closeWork} />
      <DetailPanel work={work} onClose={closeWork} />
    </section>
  )
}
