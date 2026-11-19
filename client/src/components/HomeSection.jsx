import { site } from '../data/site.js'
import { asset } from '../asset.js'
import { goSky } from '../journey.js'

export function HomePhoto() {
  return (
    <div className="home-photo" aria-hidden="true">
      <div className="home-photo-img" style={{ backgroundImage: `url(${asset('/home-sky.jpg')})` }} />
    </div>
  )
}

export default function HomeSection() {
  const enter = (e) => {
    e.preventDefault()
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

        <dl className="home-info">
          <div className="home-info-col rise" style={{ '--i': 3 }}>
            <dt data-optical="left">전시 기간</dt>
            <dd data-optical="left">{site.period}</dd>
          </div>
          <div className="home-info-col rise" style={{ '--i': 4 }}>
            <dt data-optical="left">전시 장소</dt>
            <dd data-optical="left">{site.venue}</dd>
          </div>
          <div className="home-info-col rise" style={{ '--i': 5 }}>
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

        <a href="#sky" className="home-enter rise" style={{ '--i': 6 }} onClick={enter} data-optical="left">
          {site.enter}
        </a>
      </div>
    </div>
  )
}
