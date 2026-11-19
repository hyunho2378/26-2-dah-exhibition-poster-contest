import { site } from '../data/site.js'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-text">
        {site.footer.map((line) => (
          <p key={line} data-optical="left">
            {line.split(/ (?=X )/).map((part, i) => (
              <span key={part}>
                {i ? ' ' : null}
                <span className="phrase">{part}</span>
              </span>
            ))}
          </p>
        ))}
      </div>
      <a className="footer-link" data-optical="right" href={site.dahLink} target="_blank" rel="noopener noreferrer">
        Hallym University DAH
      </a>
    </footer>
  )
}
