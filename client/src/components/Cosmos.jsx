import { useEffect, useRef } from 'react'
import { spawnMeteor, runMeteors } from '../fx/meteor.js'
import { cosmos as hue } from '../tokens.js'

const TAU = Math.PI * 2
const rand = (a, b) => a + Math.random() * (b - a)
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const easeOut = (t) => 1 - Math.pow(1 - t, 3)

// 첫 화면의 우주: 깊이가 다른 별이 떠다니고, 커서 곁에서 별들이 이어져 별자리가 되고,
// 눌러서 별을 놓아 나만의 별자리를 그리고, 스크롤하면 별이 사방으로 길게 흘러 하늘로 빨려 들어간다.
export default function Cosmos({ stageRef, progressRef }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const meteorsRef = useRef(null)

  useEffect(() => {
    const stage = stageRef.current
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)')
    const coarse = window.matchMedia('(pointer: coarse)').matches

    let W = 0
    let H = 0
    let stars = []
    const real = { x: 0, y: 0, on: false, last: 0 }
    const cur = { x: 0, y: 0 } // 별을 이어 주는 지점: 커서가 쉬면 스스로 하늘을 거닌다
    const par = { x: 0, y: 0, tx: 0, ty: 0 }
    let hover = 0
    let hoverS = 0
    let idle = false
    let clicks = 0
    const marks = []
    const rings = []
    let raf = 0
    let prev = performance.now()

    const makeStars = () => {
      const n = coarse ? 90 : Math.round(clamp((W * H) / 9000, 110, 240))
      stars = Array.from({ length: n }, () => {
        const z = Math.pow(Math.random(), 1.6) * 0.85 + 0.15
        const h = Math.random()
        return {
          x: rand(0, W),
          y: rand(0, H),
          z,
          r: 0.5 + z * 1.5,
          ph: rand(0, TAU),
          tw: rand(0.6, 1.8),
          col: h < 0.7 ? hue.white : h < 0.9 ? hue.violet : hue.blue,
        }
      })
    }

    const resize = () => {
      const r = stage.getBoundingClientRect()
      W = Math.round(r.width)
      H = Math.round(r.height)
      const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cur.x = W / 2
      cur.y = H / 2
      makeStars()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(stage)
    resize()

    const local = (e) => {
      const r = wrap.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    const onMove = (e) => {
      const p = local(e)
      real.x = p.x
      real.y = p.y
      real.on = true
      real.last = performance.now()
    }
    const onLeave = () => {
      real.on = false
    }
    const onOver = (e) => {
      hover = e.target.closest && e.target.closest('.home-enter') ? 1 : 0
    }
    const onClick = (e) => {
      if (progressRef.current > 0.2) return
      if (e.target.closest && e.target.closest('a,button')) return
      const p = local(e)
      const t = performance.now()
      marks.push({ x: p.x, y: p.y, t })
      if (marks.length > 10) marks.shift()
      rings.push({ x: p.x, y: p.y, t })
      clicks += 1
      if (clicks % 4 === 0 && !calm.matches) spawnMeteor(meteorsRef.current)
    }
    stage.addEventListener('pointermove', onMove)
    stage.addEventListener('pointerleave', onLeave)
    stage.addEventListener('pointerover', onOver)
    stage.addEventListener('click', onClick)

    const stopMeteors = runMeteors(
      meteorsRef.current,
      () => progressRef.current < 0.12 && !document.hidden && !calm.matches,
      1300,
    )

    const loop = (now) => {
      raf = window.requestAnimationFrame(loop)
      const dt = Math.min(0.05, (now - prev) / 1000)
      prev = now
      const p = progressRef.current
      if (p > 0.985) {
        // 하늘에 도착하면 이 레이어는 쉰다.
        if (!idle) {
          ctx.clearRect(0, 0, W, H)
          idle = true
        }
        return
      }
      idle = false
      const still = calm.matches

      // 날아가는 세기: 홈에서 0, 여정 한가운데에서 가장 세고, 하늘에서 다시 0
      const warpP = still ? 0 : Math.sin(Math.PI * clamp((p - 0.02) / 0.96))
      hoverS += (hover - hoverS) * 0.07
      const warp = Math.max(warpP, hoverS * 0.3)

      // 별을 이어 주는 지점
      const useReal = real.on && now - real.last < 3500 && !coarse
      const tx = useReal ? real.x : W * (0.5 + 0.3 * Math.sin(now * 0.00031))
      const ty = useReal ? real.y : H * (0.5 + 0.25 * Math.sin(now * 0.00047 + 1.3))
      cur.x += (tx - cur.x) * (useReal ? 0.35 : 0.04)
      cur.y += (ty - cur.y) * (useReal ? 0.35 : 0.04)

      // 배경 사진과 별이 커서를 따라 깊이만큼 어긋난다
      par.tx = still ? 0 : clamp((cur.x / W - 0.5) * 2, -1, 1) * (useReal ? 1 : 0.45)
      par.ty = still ? 0 : clamp((cur.y / H - 0.5) * 2, -1, 1) * (useReal ? 1 : 0.45)
      const px0 = par.x
      const py0 = par.y
      par.x += (par.tx - par.x) * 0.06
      par.y += (par.ty - par.y) * 0.06
      if (Math.abs(par.x - px0) > 0.0004 || Math.abs(par.y - py0) > 0.0004) {
        stage.style.setProperty('--px', par.x.toFixed(4))
        stage.style.setProperty('--py', par.y.toFixed(4))
      }

      ctx.clearRect(0, 0, W, H)
      const cx = W / 2
      const cy = H / 2
      const half = 0.5 * Math.hypot(W, H)
      const R = coarse ? 120 : 150
      const near = []

      for (const s of stars) {
        if (warp > 0.001) {
          const dx = s.x - cx
          const dy = s.y - cy
          const d = Math.hypot(dx, dy) || 1
          const sp = warp * 1100 * s.z * dt * (0.5 + d / half)
          s.x += (dx / d) * sp
          s.y += (dy / d) * sp
          if (s.x < -30 || s.x > W + 30 || s.y < -30 || s.y > H + 30) {
            const a = rand(0, TAU)
            const rr = rand(0.02, 0.2) * Math.min(W, H)
            s.x = cx + Math.cos(a) * rr
            s.y = cy + Math.sin(a) * rr
          }
        } else if (!still) {
          s.x -= 5 * s.z * dt
          if (s.x < -5) s.x = W + 5
        }

        let x = s.x + par.x * -22 * s.z
        let y = s.y + par.y * -14 * s.z
        let boost = 0
        if (warp < 0.15) {
          const dx = cur.x - x
          const dy = cur.y - y
          const dist = Math.hypot(dx, dy)
          if (dist < R) {
            boost = 1 - dist / R
            x += dx * boost * 0.1
            y += dy * boost * 0.1
            near.push({ x, y, k: boost })
          }
        }

        const tw = still ? 1 : 0.72 + 0.28 * Math.sin(now * 0.001 * s.tw + s.ph)
        const a = Math.min(1, (0.28 + 0.72 * s.z) * tw + boost * 0.5)
        const r = s.r * (1 + boost * 0.9)
        if (warp > 0.05) {
          const dx = x - cx
          const dy = y - cy
          const d = Math.hypot(dx, dy) || 1
          const len = warp * 90 * s.z * (0.4 + d / half)
          ctx.strokeStyle = `rgba(${s.col},${a.toFixed(3)})`
          ctx.lineWidth = r * 1.1
          ctx.beginPath()
          ctx.moveTo(x - (dx / d) * len, y - (dy / d) * len)
          ctx.lineTo(x, y)
          ctx.stroke()
        } else {
          ctx.fillStyle = `rgba(${s.col},${a.toFixed(3)})`
          ctx.beginPath()
          ctx.arc(x, y, r, 0, TAU)
          ctx.fill()
          if (s.z > 0.8) {
            ctx.fillStyle = `rgba(${s.col},${(a * 0.12).toFixed(3)})`
            ctx.beginPath()
            ctx.arc(x, y, r * 4, 0, TAU)
            ctx.fill()
          }
        }
      }

      // 커서 곁의 별들이 서로 이어져 별자리가 된다
      if (near.length) {
        ctx.lineWidth = 1
        for (const n of near) {
          ctx.strokeStyle = `rgba(${hue.violet},${(n.k * 0.55).toFixed(3)})`
          ctx.beginPath()
          ctx.moveTo(cur.x, cur.y)
          ctx.lineTo(n.x, n.y)
          ctx.stroke()
        }
        const link = R * 0.75
        for (let i = 0; i < near.length; i += 1) {
          for (let j = i + 1; j < near.length; j += 1) {
            const d = Math.hypot(near[i].x - near[j].x, near[i].y - near[j].y)
            if (d < link) {
              const al = (1 - d / link) * Math.min(near[i].k, near[j].k) * 0.7
              ctx.strokeStyle = `rgba(${hue.white},${al.toFixed(3)})`
              ctx.beginPath()
              ctx.moveTo(near[i].x, near[i].y)
              ctx.lineTo(near[j].x, near[j].y)
              ctx.stroke()
            }
          }
        }
      }

      // 눌러서 놓은 파문과 별. 이어서 누르면 선으로 이어지고 10초 뒤 사라진다.
      for (let i = rings.length - 1; i >= 0; i -= 1) {
        const age = (now - rings[i].t) / 900
        if (age >= 1) {
          rings.splice(i, 1)
          continue
        }
        ctx.strokeStyle = `rgba(${hue.white},${((1 - age) * 0.6).toFixed(3)})`
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.arc(rings[i].x, rings[i].y, 8 + 90 * easeOut(age), 0, TAU)
        ctx.stroke()
      }
      for (let i = marks.length - 1; i >= 0; i -= 1) {
        if ((now - marks[i].t) / 1000 > 10) marks.splice(i, 1)
      }
      const fade = (m) => {
        const age = (now - m.t) / 1000
        return age < 8 ? 1 : Math.max(0, 1 - (age - 8) / 2)
      }
      for (let i = 1; i < marks.length; i += 1) {
        const al = Math.min(fade(marks[i - 1]), fade(marks[i])) * 0.75
        ctx.strokeStyle = `rgba(${hue.violet},${al.toFixed(3)})`
        ctx.lineWidth = 1.3
        ctx.beginPath()
        ctx.moveTo(marks[i - 1].x, marks[i - 1].y)
        ctx.lineTo(marks[i].x, marks[i].y)
        ctx.stroke()
      }
      marks.forEach((m, i) => {
        const al = fade(m)
        const pulse = 1 + 0.25 * Math.sin(now * 0.004 + i)
        ctx.fillStyle = `rgba(${hue.violet},${(al * 0.16).toFixed(3)})`
        ctx.beginPath()
        ctx.arc(m.x, m.y, 15 * pulse, 0, TAU)
        ctx.fill()
        ctx.fillStyle = `rgba(${hue.white},${al.toFixed(3)})`
        ctx.beginPath()
        ctx.arc(m.x, m.y, 3.2 * pulse, 0, TAU)
        ctx.fill()
      })
    }
    raf = window.requestAnimationFrame(loop)

    return () => {
      window.cancelAnimationFrame(raf)
      ro.disconnect()
      stopMeteors()
      stage.removeEventListener('pointermove', onMove)
      stage.removeEventListener('pointerleave', onLeave)
      stage.removeEventListener('pointerover', onOver)
      stage.removeEventListener('click', onClick)
    }
  }, [stageRef, progressRef])

  return (
    <div className="cosmos" ref={wrapRef} aria-hidden="true">
      <canvas ref={canvasRef} />
      <div className="meteors" ref={meteorsRef} />
    </div>
  )
}
