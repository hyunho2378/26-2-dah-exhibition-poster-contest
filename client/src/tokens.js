// 색, 글자, 간격, 레이아웃, 그림자, 모션 토큰. 화면의 모든 값은 이 파일을 거친다.
// 색은 홍보 포스터(남색 밤하늘과 보라 지평선)에서 가져왔다.

export const colors = {
  night: '#0b0c1d',        // 바탕, 포스터 위쪽 밤하늘
  nightRaised: '#14163a',  // 떠 있는 판
  nightHigh: '#1d1f4d',    // 손을 올린 판, 눌림 면
  violet: '#7b52c7',       // 포스터 지평선 보라, 강조
  violetBright: '#c7b2ff', // 어두운 바탕 위 강조 글자
  white: '#ffffff',
  text: '#ffffff',
  textSub: '#c3c4dc',      // 바탕 대비 11.0:1
  textMute: '#9799bd',     // 바탕 대비 6.9:1
  line: 'rgba(199, 178, 255, 0.42)',
  lineHigh: 'rgba(199, 178, 255, 0.9)', // 고대비 설정
  textSubHigh: '#e2e3f2',               // 고대비 설정
  scrim: 'rgba(11, 12, 29, 0.72)',
  focus: '#c7b2ff',
  skyTint: '#4a2bb0',      // 하늘 색을 포스터 남보라로 물들이는 색
  starCore: '#ffffff',
  starGlowNear: 'rgba(199, 178, 255, 0.85)',
  starGlowFar: 'rgba(123, 82, 199, 0.45)',
}

// 하늘 엔진 화면을 사이트 색에 맞추는 값
export const sky = {
  tintOpacity: 0.52,
  filter: 'brightness(0.74) contrast(1.18)',
  starRelativeScale: 1.38, // 엔진 기본 1.1
  starLinearScale: 1.0,    // 엔진 기본 0.8
  limitMag: 5.6,           // 이보다 어두운 별은 그리지 않아 작품 별이 잘 보이게 한다
  bortle: 2,               // 하늘 밝기, 엔진 기본 3
}

export const fonts = {
  display: "'Playfair Display', 'Pretendard Variable', Pretendard, serif",
  body: "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif",
  mono: "'IBM Plex Mono', 'Pretendard Variable', ui-monospace, monospace",
}

// 글자 역할마다 크기, 굵기, 행간, 자간을 함께 정한다.
export const type = {
  hero:     { size: 'clamp(3.25rem, 2.1rem + 6.2vw, 10.5rem)', weight: 400, leading: 0.92, tracking: '-0.02em', font: 'display' },
  title:    { size: 'clamp(1.75rem, 1.4rem + 1.5vw, 2.75rem)', weight: 500, leading: 1.15, tracking: '-0.015em', font: 'body' },
  titleEn:  { size: 'clamp(1.75rem, 1.4rem + 1.5vw, 2.75rem)', weight: 400, leading: 1.1, tracking: '-0.01em', font: 'display' },
  lead:     { size: 'clamp(1.0625rem, 0.98rem + 0.35vw, 1.3125rem)', weight: 500, leading: 1.5, tracking: '-0.005em', font: 'body' },
  body:     { size: 'clamp(0.9375rem, 0.9rem + 0.15vw, 1.0625rem)', weight: 400, leading: 1.75, tracking: '0em', font: 'body' },
  label:    { size: '0.75rem', weight: 500, leading: 1.4, tracking: '0.12em', font: 'mono' },
  meta:     { size: '0.8125rem', weight: 400, leading: 1.5, tracking: '0.02em', font: 'mono' },
  nav:      { size: '0.875rem', weight: 500, leading: 1.2, tracking: '0.04em', font: 'body' },
  starNum:  { size: '0.6875rem', weight: 500, leading: 1, tracking: '0.06em', font: 'mono' },
  starName: { size: '0.8125rem', weight: 500, leading: 1.3, tracking: '-0.005em', font: 'body' },
}

export const space = {
  1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '24px', 6: '32px', 7: '48px', 8: '64px', 9: '96px',
}

export const layout = {
  gutter: 'clamp(20px, 4.4vw, 72px)', // 헤더와 본문, 푸터가 같은 값을 쓴다
  maxWidth: '2200px',
  panelWidth: 'clamp(400px, 36vw, 760px)',
  panelPad: 'clamp(20px, 2.2vw, 44px)', // 작품 창 안쪽 좌우 여백, 그림과 글과 단추가 같은 선에서 시작한다
  headerHeight: '72px',
}

export const radius = { base: '6px' }

// 높이 단계 그림자: 0 바닥, 1 놓인 면, 2 떠 있는 판, 3 손을 올린 면
export const shadow = {
  0: 'none',
  1: '0 1px 2px rgba(0, 0, 8, 0.5), 0 4px 12px rgba(0, 0, 8, 0.35)',
  2: '0 2px 4px rgba(0, 0, 8, 0.45), 0 18px 48px rgba(0, 0, 8, 0.55)',
  3: '0 4px 8px rgba(0, 0, 8, 0.45), 0 28px 72px rgba(0, 0, 8, 0.6)',
}

export const motion = {
  fast: '180ms',
  base: '360ms',
  slow: '900ms',
  ease: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
  skyMove: 1.2, // 별로 다가가는 시간(초)
}

export const z = { sky: 0, overlay: 10, header: 20, panel: 30, index: 40 }

export const breakpoints = { md: 768, lg: 1024 }

// tokens를 CSS 변수로 옮긴다. 스타일 파일은 이 변수만 쓴다.
// 사용자 설정(고대비)이 덮어쓸 수 있게 head 맨 앞의 :root 규칙으로 넣는다.
export function tokenVars() {
  const v = {}
  Object.entries(colors).forEach(([k, val]) => (v[`--c-${k}`] = val))
  Object.entries(fonts).forEach(([k, val]) => (v[`--f-${k}`] = val))
  Object.entries(type).forEach(([k, t]) => {
    v[`--t-${k}-size`] = t.size
    v[`--t-${k}-weight`] = String(t.weight)
    v[`--t-${k}-leading`] = String(t.leading)
    v[`--t-${k}-tracking`] = t.tracking
    v[`--t-${k}-font`] = fonts[t.font]
  })
  Object.entries(space).forEach(([k, val]) => (v[`--s-${k}`] = val))
  Object.entries(layout).forEach(([k, val]) => (v[`--l-${k}`] = val))
  v['--r-base'] = radius.base
  v['--sky-tint-opacity'] = String(sky.tintOpacity)
  v['--sky-filter'] = sky.filter
  Object.entries(shadow).forEach(([k, val]) => (v[`--e-${k}`] = val))
  v['--m-fast'] = motion.fast
  v['--m-base'] = motion.base
  v['--m-slow'] = motion.slow
  v['--m-ease'] = motion.ease
  Object.entries(z).forEach(([k, val]) => (v[`--z-${k}`] = String(val)))
  return v
}

export function applyTokens() {
  const css = `:root{${Object.entries(tokenVars()).map(([k, val]) => `${k}:${val}`).join(';')}}`
  let el = document.getElementById('tokens')
  if (!el) {
    el = document.createElement('style')
    el.id = 'tokens'
    document.head.prepend(el)
  }
  el.textContent = css
}
