import { useEffect, useRef, useState } from 'react'
import { X, Play } from 'lucide-react'
import { awardNames } from '../data/works.js'
import TitleText from './TitleText.jsx'

// 작품소개 원문을 줄 단위로 나눠 보여 준다. 글자는 바꾸지 않고, 줄 앞뒤 빈칸만 화면에서 뺀다.
// "1. 제목"은 큰 소제목, "1) 제목"은 굵은 소제목, 나머지는 본문이다.
function Description({ text }) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  return (
    <div className="detail-desc">
      {lines.map((ln, i) => {
        if (/^\d+\.\s/.test(ln)) return <h3 key={i} className="detail-desc-head" data-optical="left">{ln}</h3>
        if (/^\d+\)\s/.test(ln)) return <p key={i} className="detail-desc-sub" data-optical="left">{ln}</p>
        return <p key={i} className="detail-desc-body" data-optical="left">{ln}</p>
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
        className="detail-img"
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
      <img key={work.id} className="detail-img" src={work.full} alt={alt} decoding="async" />
      {work.motion ? (
        <button type="button" className="btn-raised detail-play" onClick={() => setPlay(true)} aria-label="모션 포스터 재생">
          <Play size={20} strokeWidth={1.5} aria-hidden="true" />
        </button>
      ) : null}
    </>
  )
}

export default function DetailPanel({ work, onClose }) {
  const rootRef = useRef(null)
  const scrollRef = useRef(null)
  const textRef = useRef(null)
  const closeRef = useRef(null)
  const wasOpen = useRef(false)
  const [shown, setShown] = useState(work)

  useEffect(() => {
    if (work) setShown(work)
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    if (textRef.current) textRef.current.scrollTop = 0
  }, [work])

  useEffect(() => {
    rootRef.current?.toggleAttribute('inert', !work)
    if (work && !wasOpen.current) closeRef.current?.focus({ preventScroll: true, focusVisible: false })
    wasOpen.current = Boolean(work)
  }, [work])

  const w = work || shown
  if (!w) return <aside ref={rootRef} className="detail" aria-hidden="true" />
  const heading = w.title || w.author

  return (
    <aside ref={rootRef} className={`detail${work ? ' is-open' : ''}`} aria-hidden={!work} aria-label={`${w.id} ${heading}`}>
      <div className="detail-bar">
        <button type="button" ref={closeRef} className="btn-raised" onClick={onClose} aria-label="닫기">
          <X size={20} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
      <div className="detail-scroll" ref={scrollRef}>
        <div className="detail-grid">
          <figure className="detail-media">
            <Media work={w} />
          </figure>
          <div className="detail-text" ref={textRef} data-optical="top">
            <h2 className="detail-title" data-optical="left">
              <TitleText text={heading} stack />
            </h2>
            {w.title ? <p className="detail-author" data-optical="left">{w.author}</p> : null}
            <p className="detail-meta" data-optical="left">
              <span>{w.studentId}</span>
              <span>{w.department}</span>
            </p>
            {w.award ? <p className="detail-award" data-optical="left">{awardNames[w.award]}</p> : null}
            {w.description ? <Description text={w.description} /> : null}
          </div>
        </div>
      </div>
    </aside>
  )
}
