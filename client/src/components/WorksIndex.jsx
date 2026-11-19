import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { works, awardNames } from '../data/works.js'
import TitleText from './TitleText.jsx'

export default function WorksIndex({ open, current, onClose, onPick }) {
  const rootRef = useRef(null)
  const closeRef = useRef(null)
  useEffect(() => {
    rootRef.current?.toggleAttribute('inert', !open)
    if (open && closeRef.current) closeRef.current.focus({ preventScroll: true })
  }, [open])

  return (
    <div ref={rootRef} className={`index${open ? ' is-open' : ''}`} aria-hidden={!open}>
      <button type="button" className="index-scrim" aria-label="목록 닫기" tabIndex={-1} onClick={onClose} />
      <section className="index-sheet" role="dialog" aria-modal="true" aria-label="작품 목록">
        <div className="index-bar">
          <button type="button" ref={closeRef} className="btn-raised" onClick={onClose} aria-label="목록 닫기">
            <X size={20} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
        <ol className="index-list">
          {works.map((w) => (
            <li key={w.id}>
              <button type="button" className={`index-item${current === w.id ? ' is-current' : ''}`} onClick={() => onPick(w.id)}>
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
