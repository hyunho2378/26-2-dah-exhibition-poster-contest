import { site } from '../data/site.js'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-text">
        {site.footer.map((line) => (
          <p key={line} data-optical="left">{line}</p>
        ))}
      </div>
      <div className="footer-links">
        <a data-optical="right" href={site.dahLink} target="_blank" rel="noopener noreferrer">Hallym University DAH</a>
        <a data-optical="right" href={site.sourceLink} target="_blank" rel="noopener noreferrer">{site.engineCredit}</a>
      </div>
    </footer>
  )
}
