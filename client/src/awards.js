import { useSyncExternalStore } from 'react'

// 수상 페이지는 주소 끝의 #awards로 열린다. 새로고침하거나 주소를 공유해도 바로 수상 페이지가 열린다.
// 열 때는 기록을 하나 쌓고, 뒤로 가기는 닫기로 쓴다.
const HASH = '#awards'
const base = () => import.meta.env.BASE_URL

let open = typeof window !== 'undefined' && window.location.hash === HASH
const subs = new Set()
const emit = () => subs.forEach((f) => f())

export const isAwardsOpen = () => open

export function openAwards() {
  if (open) return
  open = true
  window.history.pushState({ awards: true }, '', base() + HASH)
  emit()
}

export function closeAwards() {
  if (!open) return
  if (window.history.state && window.history.state.awards) window.history.back()
  else {
    open = false
    window.history.replaceState(null, '', base())
    emit()
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    const next = window.location.hash === HASH
    if (next !== open) {
      open = next
      emit()
    }
  })
}

const subscribe = (f) => {
  subs.add(f)
  return () => subs.delete(f)
}

export const useAwardsOpen = () => useSyncExternalStore(subscribe, isAwardsOpen, () => false)

// 하늘의 보기 상태: false는 Contents(전체), true는 Awards(수상작만 빛남). 홈에서 고른 보기가 하늘에 그대로 이어진다.
let lit = false
const litSubs = new Set()
export const isLit = () => lit
export function setLit(v) {
  if (lit === v) return
  lit = v
  litSubs.forEach((f) => f())
}
const subscribeLit = (f) => {
  litSubs.add(f)
  return () => litSubs.delete(f)
}
export const useLit = () => useSyncExternalStore(subscribeLit, isLit, () => false)
