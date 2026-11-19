// 작품명 끝의 괄호 부분(예: 영문 병기)은 한 덩어리로 줄을 바꾼다.
// stack이면 괄호 부분을 다음 줄에 둔다(작품 창 제목).
export default function TitleText({ text, stack = false }) {
  const m = /^(.*?)\s*(\([^()]+\))$/.exec(text || '')
  if (!m || !m[1]) return text
  if (stack) {
    return (
      <>
        {m[1]}
        <span className="title-sub">{m[2]}</span>
      </>
    )
  }
  return (
    <>
      <span className="phrase">{m[1]}</span>{' '}
      <span className="phrase">{m[2]}</span>
    </>
  )
}
