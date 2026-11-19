import { useEffect } from 'react'
import { applyOptical } from './optical.js'
import Journey from './components/Journey.jsx'
import Footer from './components/Footer.jsx'

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
  return (
    <>
      <Journey />
      <Footer />
    </>
  )
}
