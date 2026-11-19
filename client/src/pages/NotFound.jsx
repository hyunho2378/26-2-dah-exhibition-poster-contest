import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="notfound">
      <h1 className="notfound-title">404</h1>
      <p className="notfound-text">찾는 페이지가 이 하늘에 없습니다.</p>
      <Link to="/" className="notfound-link">처음 화면으로</Link>
    </main>
  )
}
