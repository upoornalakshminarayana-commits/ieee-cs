import { Mail, Phone, MapPin, Sparkles, Compass } from 'lucide-react'
import './Footer.css'
import { EVENT } from '../../data/event'

const HIEROGLYPHS_BAND = '𓀀 𓁁 𓂀 𓃠 𓄿 𓅱 𓆣 𓇌 𓈖 𓉐 𓊪 𓋴 𓌀 𓍛 𓎡 𓏏 𓐍 𓀀 𓁁 𓂀 𓃠 𓄿 𓅱 𓆣 𓇌 𓈖 𓉐 𓊪 𓋴 𓌀 𓍛 𓎡 𓏏 𓐍'

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export default function Footer() {
  return (
    <footer className="site-footer" aria-label="Egyptian Expedition Footer">
      {/* Hieroglyph Golden Marquee Band */}
      <div className="footer-hieroglyph-band" aria-hidden="true">
        <span className="footer-hieroglyph-text">{HIEROGLYPHS_BAND}</span>
      </div>

      <div className="footer-grid">
        {/* Brand Column */}
        <div className="footer-brand">
          <div className="footer-brand-title">
            <span className="footer-brand-glyph">𓆣</span>
            <p className="footer-logo">{EVENT.name}</p>
          </div>
          <p className="footer-logo-sub">ANCIENT EXPEDITION • {EVENT.date}</p>
          <p className="footer-tagline-final">
            The ultimate ancient Egyptian treasure hunt challenge organized by{' '}
            <span className="footer-highlight">{EVENT.clubName}</span>,{' '}
            <span className="footer-highlight">{EVENT.collegeName}</span>.
          </p>

          {/* Social Links */}
          <div className="footer-social">
            {([
              { href: EVENT.socialLinks.instagram, label: 'INSTAGRAM' },
              { href: EVENT.socialLinks.twitter,   label: 'TWITTER' },
              { href: EVENT.socialLinks.facebook,  label: 'FACEBOOK' },
              { href: EVENT.socialLinks.youtube,   label: 'YOUTUBE' },
            ] as const).map(({ href, label }) => (
              <a
                key={label}
                href={href}
                className="footer-social-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Contact Column */}
        <div className="footer-col">
          <p className="footer-col-title">EXPEDITION HQ</p>
          <div className="footer-divider-mini" />
          <address className="footer-address">
            <div className="footer-contact-item">
              <Mail size={15} className="footer-contact-icon" />
              <a href={`mailto:${EVENT.contactEmail}`} className="footer-link-text">
                {EVENT.contactEmail}
              </a>
            </div>
            <div className="footer-contact-item">
              <Phone size={15} className="footer-contact-icon" />
              <a href={`tel:${EVENT.contactPhone}`} className="footer-link-text">
                {EVENT.contactPhone}
              </a>
            </div>
            <div className="footer-contact-item">
              <MapPin size={15} className="footer-contact-icon" />
              <span className="footer-link-text">
                {EVENT.venue.name}, {EVENT.venue.city}
              </span>
            </div>
          </address>
        </div>

        {/* Quick Navigate Column */}
        <div className="footer-col">
          <p className="footer-col-title">NAVIGATION</p>
          <div className="footer-divider-mini" />
          <ul className="footer-links-list">
            <li>
              <button className="footer-nav-btn" onClick={() => scrollTo('hero')}>
                <Compass size={13} />
                <span>EXPEDITION GATEWAY</span>
              </button>
            </li>
            <li>
              <button className="footer-nav-btn" onClick={() => scrollTo('story')}>
                <span>THE 6 CHRONICLES</span>
              </button>
            </li>
            <li>
              <button className="footer-nav-btn" onClick={() => scrollTo('treasure')}>
                <span>TREASURE CHAMBER</span>
              </button>
            </li>
            <li>
              <button className="footer-nav-btn" onClick={() => scrollTo('register')}>
                <Sparkles size={13} />
                <span>REGISTER ENTRY</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <p className="footer-closing-line">
          "THE TOMB IS SEALED. THE GLORY IS ETERNAL."
        </p>
        <span className="footer-scarab">𓆣</span>
        <p className="footer-copyright">
          © {new Date().getFullYear()} {EVENT.name}. All Ancient Mysteries Reserved.
        </p>
      </div>
    </footer>
  )
}
