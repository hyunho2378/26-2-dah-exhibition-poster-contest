import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { X, ArrowLeft, ArrowRight, Play } from 'lucide-react'
import { getAdjacent, awardNames } from '../data/works.js'
import TitleText from './TitleText.jsx'

function Description({ text }) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)
  return (
    <div className="panel-desc">
      {blocks.map((b, i) => {
        const lines = b.split('\n')
        const head = /^\d+\.\s/.test(lines[0])
        if (head && lines.length === 1) return <h3 key={i} className="panel-desc-head" data-optical="left">{lines[0]}</h3>
        return (
          <p key={i} data-optical="left">
            {lines.map((ln, j) => (
              <span key={j} className={/^\d+\)\s/.test(ln) ? 'panel-desc-sub' : undefined}>
                {ln}
                {j < lines.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}

function Media({ work }) {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [play, setPlay] = useState(!reduce)
  useEffect(() => setPlay(!reduce), [work.id, reduce])
  const alt = `${work.author}, ${work.title || '작품'}`
  if (work.motion && play) {
    return (
      <video
        key={work.id}
        className="panel-img"
        src={work.motion}
        poster={work.full}
        autoPlay
        muted
        loop
        playsInline
        controls={reduce}
        aria-label={`${alt} 모션 포스터`}
      />
    )
  }
  return (
    <>
      <img key={work.id} className="panel-img" src={work.full} alt={alt} decoding="async" />
      {work.motion ? (
        <button type="button" className="panel-play" onClick={() => setPlay(true)}>
          <Play size={20} strokeWidth={1.5} aria-hidden="true" />
          <span>모션 포스터 재생</span>
        </button>
      ) : null}
    </>
  )
}

export default function WorkPanel({ work, onClose, focusOnOpen }) {
  const scrollRef = useRef(null)
  const closeRef = useRef(null)
  const [shown, setShown] = useState(work)

  useEffect(() => {
    if (work) setShown(work)
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [work])

  const wasOpen = useRef(false)
  useEffect(() => {
    if (work && !wasOpen.current && focusOnOpen && closeRef.current) closeRef.current.focus({ preventScroll: true })
    wasOpen.current = Boolean(work)
  }, [work, focusOnOpen])

  const w = work || shown
  if (!w) return <aside className="panel" aria-hidden="true" />
  const { prev, next } = getAdjacent(w.id)
  const heading = w.title || w.author

  return (
    <aside className={`panel${work ? ' is-open' : ''}`} aria-hidden={!work} aria-label={`${w.id} ${heading}`}>
      <div className="panel-scroll" ref={scrollRef}>
        <div className="panel-bar">
          <button type="button" ref={closeRef} className="panel-close" onClick={onClose} tabIndex={work ? 0 : -1}>
            <X size={20} strokeWidth={1.5} aria-hidden="true" />
            <span>하늘로</span>
          </button>
        </div>
        <figure className="panel-media">
          <Media work={w} />
        </figure>
        <div className="panel-body">
          <div className="panel-head">
            <span className="panel-num" data-optical="left">{w.id}</span>
            <h2 className="panel-title"><TitleText text={heading} stack /></h2>
          </div>
          <p className="panel-author">
            {w.title ? <span className="panel-author-name" data-optical="left">{w.author}</span> : null}
            <span className="panel-author-meta" data-optical="left">{w.studentId} / {w.department}</span>
          </p>
          {w.award ? <p className="panel-award" data-optical="left">{awardNames[w.award]}</p> : null}
          {w.description ? <Description text={w.description} /> : null}
        </div>
        <nav className="panel-nav" aria-label="이전 작품과 다음 작품">
          <Link to={`/sky/${prev.id}`} className="panel-nav-link" tabIndex={work ? 0 : -1}>
            <ArrowLeft size={20} strokeWidth={1.5} aria-hidden="true" />
            <span className="panel-nav-num">{prev.id}</span>
            <span className="panel-nav-title">{prev.title || prev.author}</span>
          </Link>
          <Link to={`/sky/${next.id}`} className="panel-nav-link is-next" tabIndex={work ? 0 : -1}>
            <span className="panel-nav-num">{next.id}</span>
            <span className="panel-nav-title">{next.title || next.author}</span>
            <ArrowRight size={20} strokeWidth={1.5} aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </aside>
  )
}
