import { useEffect, useRef } from 'react'
import { applyOptical } from './optical.js'
import Journey from './components/Journey.jsx'
import AwardsPage from './components/AwardsPage.jsx'
import { useAwardsOpen } from './awards.js'

// 화면이 바뀌거나 폭이 바뀔 때마다 글자 윤곽 정렬을 다시 잰다.
function useOpticalAlign() {
  useEffect(() => {
    let raf = 0
    const run = () => {
      window.cancelAnimationFrame(raf)
      raf = window.requestAnimationFrame(() => applyOptical())
    }
    run()
    document.fonts?.ready.then(run)
    const mo = new MutationObserver(run)
    mo.observe(document.getElementById('root'), { childList: true, subtree: true, characterData: true })
    window.addEventListener('resize', run)
    return () => {
      mo.disconnect()
      window.removeEventListener('resize', run)
      window.cancelAnimationFrame(raf)
    }
  }, [])
}

export default function App() {
  useOpticalAlign()
  const awardsOn = useAwardsOpen()
  const bodyRef = useRef(null)
  // 수상 페이지가 덮고 있는 동안 뒤쪽 화면에는 초점이 가지 않는다.
  useEffect(() => {
    bodyRef.current?.toggleAttribute('inert', awardsOn)
  }, [awardsOn])
  return (
    <>
      <div ref={bodyRef}>
        <Journey />
      </div>
      <AwardsPage />
    </>
  )
}
