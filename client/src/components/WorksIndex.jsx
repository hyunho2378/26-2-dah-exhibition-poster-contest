import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { works, awardNames } from '../data/works.js'
import TitleText from './TitleText.jsx'

export default function WorksIndex({ open, current, onClose, onPick }) {
  const closeRef = useRef(null)
  useEffect(() => {
    if (open && closeRef.current) closeRef.current.focus({ preventScroll: true })
  }, [open])

  return (
    <div className={`index${open ? ' is-open' : ''}`} aria-hidden={!open}>
      <button type="button" className="index-scrim" aria-label="목록을 닫고 하늘로" tabIndex={-1} onClick={onClose} />
      <section className="index-sheet" role="dialog" aria-modal="true" aria-label="작품 목록">
        <div className="index-bar">
          <h2 className="index-title" data-optical="left">작품 목록</h2>
          <button type="button" ref={closeRef} className="index-close" onClick={onClose} tabIndex={open ? 0 : -1}>
            <X size={20} strokeWidth={1.5} aria-hidden="true" />
            <span>하늘로</span>
          </button>
        </div>
        <ol className="index-list">
          {works.map((w) => (
            <li key={w.id}>
              <button
                type="button"
                className={`index-item${current === w.id ? ' is-current' : ''}`}
                onClick={() => onPick(w.id)}
                tabIndex={open ? 0 : -1}
              >
                <img src={w.thumb} alt="" loading="lazy" decoding="async" className="index-thumb" />
                <span className="index-num">{w.id}</span>
                <span className="index-text">
                  <span className="index-work"><TitleText text={w.title || w.author} /></span>
                  <span className="index-author">{w.title ? w.author : w.department}</span>
                  {w.award ? <span className="index-award">{awardNames[w.award]}</span> : null}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
