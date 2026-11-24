import { site } from '../data/site.js'
import { asset } from '../asset.js'
import { goSky } from '../journey.js'
import { setLit } from '../awards.js'

export function HomePhoto() {
  return (
    <div className="home-photo" aria-hidden="true">
      <div className="home-photo-img" style={{ backgroundImage: `url(${asset('/home-sky.jpg')})` }} />
    </div>
  )
}

export function HomeScrim() {
  return <div className="home-scrim" aria-hidden="true" />
}

export default function HomeSection() {
  // Contents는 작품 전체가 보이는 하늘로, Awards는 수상작만 빛나는 하늘로 들어간다.
  const enter = (lit) => (e) => {
    e.preventDefault()
    setLit(lit)
    goSky()
  }

  return (
    <div className="home" id="home">
      <div className="home-main">
        <h1 className="home-title">
          <span className="rise" style={{ '--i': 0 }} data-optical="left">BEYOND</span>
          <span className="rise" style={{ '--i': 1 }} data-optical="left">THE KNOWN</span>
        </h1>
        <p className="home-subtitle rise" style={{ '--i': 2 }} data-optical="left">
          <span className="phrase">{site.term} 디지털인문예술전공</span>{' '}
          <span className="phrase">프로젝트 전시회 포스터 공모전</span>
        </p>

        <dl className="home-info home-about">
          <div className="home-info-col rise" style={{ '--i': 3 }}>
            <dt data-optical="left">주제</dt>
            <dd className="home-theme" data-optical="left">
              {site.themeLines.map((t, i) => (
                <span key={i}>
                  {i > 0 ? ' ' : null}
                  <span className="phrase">{t}</span>
                </span>
              ))}
            </dd>
          </div>
        </dl>

        <dl className="home-info home-facts">
          <div className="home-info-col rise" style={{ '--i': 4 }}>
            <dt data-optical="left">전시 기간</dt>
            <dd data-optical="left">{site.period}</dd>
          </div>
          <div className="home-info-col rise" style={{ '--i': 5 }}>
            <dt data-optical="left">전시 장소</dt>
            <dd data-optical="left">{site.venue}</dd>
          </div>
          <div className="home-info-col rise" style={{ '--i': 6 }}>
            <dt data-optical="left">시상</dt>
            <dd>
              <ul className="home-awards">
                {site.awards.map((a) => (
                  <li key={a.name}>
                    <span className="home-award-name" data-optical="left">{a.name}</span>
                    <span className="home-award-count">{a.count}</span>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>

        <dl className="home-info home-contents">
          <div className="home-info-col rise" style={{ '--i': 7 }}>
            <dt data-optical="left">작품 보기</dt>
            <dd className="home-links">
              <a href="#sky" className="home-enter" onClick={enter(false)}>
                {site.enter}
              </a>
              <a href="#awards" className="home-enter" onClick={enter(true)}>
                {site.awardsLink}
              </a>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
