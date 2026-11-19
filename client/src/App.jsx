import { useEffect } from 'react'
import { Routes, Route, useLocation, useNavigationType } from 'react-router-dom'
import { applyOptical } from './optical.js'
import Home from './pages/Home.jsx'
import Sky from './pages/Sky.jsx'
import NotFound from './pages/NotFound.jsx'

// 다른 화면으로 가면 맨 위에서 시작한다. 뒤로 가기만 이전 위치를 둔다.
function ScrollToTop() {
  const { pathname } = useLocation()
  const navType = useNavigationType()
  useEffect(() => {
    if (navType !== 'POP') window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, navType])
  return null
}

// 화면이 바뀌거나 폭이 바뀔 때마다 글자 윤곽 정렬을 다시 잰다.
function OpticalAlign() {
  const location = useLocation()
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
  }, [location.pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <OpticalAlign />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sky" element={<Sky />} />
        <Route path="/sky/:id" element={<Sky />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
