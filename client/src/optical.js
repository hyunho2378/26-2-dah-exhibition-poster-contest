// 시각 정렬: 글자 상자 끝이 아니라 실제로 보이는 글자 윤곽을 같은 선에 맞춘다.
// data-optical="left"  첫 글자의 왼쪽 여백(side bearing)만큼 왼쪽으로 당긴다.
// data-optical="right" 마지막 글자의 오른쪽 여백과 자간만큼 오른쪽으로 민다.
// data-optical="top"   첫 줄 첫 글자의 윗선이 상자 윗선에 닿도록 반 행간만큼 위로 올린다.
const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null
const ctx = canvas ? canvas.getContext('2d') : null

function textNodes(el) {
  const out = []
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP),
  })
  let n = walker.nextNode()
  while (n) {
    out.push(n)
    n = walker.nextNode()
  }
  return out
}

function fontOf(node) {
  const cs = getComputedStyle(node.parentElement)
  return { font: `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, spacing: parseFloat(cs.letterSpacing) || 0, cs }
}

function leftBearing(el) {
  const nodes = textNodes(el)
  if (!nodes.length) return 0
  const n = nodes[0]
  const i = n.textContent.search(/\S/)
  ctx.font = fontOf(n).font
  const m = ctx.measureText(n.textContent[i])
  return -m.actualBoundingBoxLeft
}

function rightGap(el) {
  const nodes = textNodes(el)
  if (!nodes.length) return 0
  const n = nodes[nodes.length - 1]
  const t = n.textContent.replace(/\s+$/, '')
  const ch = t[t.length - 1]
  const { font, spacing } = fontOf(n)
  ctx.font = font
  const m = ctx.measureText(ch)
  return m.width - m.actualBoundingBoxRight + spacing
}

function topInset(el) {
  const nodes = textNodes(el)
  if (!nodes.length) return 0
  const n = nodes[0]
  const i = n.textContent.search(/\S/)
  const { font, cs } = fontOf(n)
  ctx.font = font
  const m = ctx.measureText(n.textContent[i])
  const fa = m.fontBoundingBoxAscent
  const fd = m.fontBoundingBoxDescent
  let lh = parseFloat(cs.lineHeight)
  if (!lh) lh = parseFloat(cs.fontSize) * 1.2
  return (lh - (fa + fd)) / 2 + (fa - m.actualBoundingBoxAscent)
}

export function applyOptical(root = document) {
  if (!ctx) return
  root.querySelectorAll('[data-optical]').forEach((el) => {
    const sides = (el.getAttribute('data-optical') || '').split(/\s+/)
    if (sides.includes('left')) el.style.marginLeft = `${-leftBearing(el).toFixed(2)}px`
    if (sides.includes('right')) el.style.marginRight = `${-rightGap(el).toFixed(2)}px`
    if (sides.includes('top')) el.style.marginTop = `${-topInset(el).toFixed(2)}px`
  })
}
