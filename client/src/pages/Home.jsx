import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { site } from '../data/site.js'
import { loadEngine } from '../engine/sky.js'
import Footer from '../components/Footer.jsx'
import { asset } from '../asset.js'

export default function Home() {
  useEffect(() => {
    document.title = `${site.title}, ${site.term} ${site.subtitle}`
    // 홈을 보는 동안 하늘 엔진을 미리 불러 둔다.
    const t = window.setTimeout(() => loadEngine(), 1200)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <div className="home">
      <div className="home-sky" aria-hidden="true" style={{ backgroundImage: `url(${asset('/home-sky.jpg')})` }} />
      <main className="home-main">
        <h1 className="home-title">
          <span data-optical="left">BEYOND</span>
          <span data-optical="left">THE KNOWN</span>
        </h1>
        <p className="home-subtitle" data-optical="left">
          <span className="phrase">{site.term} 디지털인문예술전공</span>{' '}
          <span className="phrase">프로젝트 전시회 포스터 공모전</span>
        </p>

        <dl className="home-info">
          <div className="home-info-col">
            <dt data-optical="left">전시 기간</dt>
            <dd data-optical="left">{site.period}</dd>
          </div>
          <div className="home-info-col">
            <dt data-optical="left">전시 장소</dt>
            <dd data-optical="left">{site.venue}</dd>
          </div>
          <div className="home-info-col">
            <dt data-optical="left">시상</dt>
            <dd>
              <ul className="home-awards">
                {site.awards.map((a) => (
                  <li key={a.name}>
                    <span className="home-award-name" data-optical="left">{a.name}</span>
                    <span className="home-award-count">{a.count}</span>
                    <span className="home-award-prize">{a.prize}</span>
                    {a.note ? <span className="home-award-note">{a.note}</span> : null}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>

        <Link to="/sky" className="home-enter">
          <span data-optical="left">출품작이 놓인 하늘</span>
          <ArrowRight size={24} strokeWidth={1.5} aria-hidden="true" />
        </Link>
      </main>
      <Footer />
    </div>
  )
}
