import React from 'react'
import ReactDOM from 'react-dom/client'
import { applyTokens } from './tokens.js'
import App from './App.jsx'
import './styles/base.css'

applyTokens()

// 한 장짜리 화면이다. 새로고침하면 늘 첫 화면(맨 위)에서 시작한다.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
if (window.location.hash !== '#awards') history.replaceState(null, '', import.meta.env.BASE_URL)
window.scrollTo(0, 0)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
