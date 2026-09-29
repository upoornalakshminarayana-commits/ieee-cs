import { useEffect, useRef, useState } from 'react'
import { Sparkles, Menu, X, Compass, Shield } from 'lucide-react'
import './Navigation.css'
import { EVENT } from '../../data/event'

interface NavigationProps {
  onRegisterClick: () => void
}

export default function Navigation({ onRegisterClick }: NavigationProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    setMobileOpen(false)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <nav
        ref={navRef}
        className={`nav-root ${scrolled ? 'nav-scrolled' : ''}`}
        aria-label="Egyptian Expedition Navigation"
      >
        <div className="nav-container">
          
          {/* Logo with Egyptian Scarab Icon */}
          <a
            href="#hero"
            className="nav-logo"
            onClick={(e) => { e.preventDefault(); scrollToSection('hero') }}
            aria-label={`${EVENT.name} – Return to Top`}
          >
            <div className="nav-scarab-badge">
              <span className="nav-scarab-glyph">𓆣</span>
            </div>
            <div className="nav-brand-text">
              <span className="nav-logo-title">{EVENT.name}</span>
              <span className="nav-logo-sub">ANCIENT EXPEDITION</span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <ul className="nav-links" role="list">
            <li>
              <button
                className="nav-link-btn"
                onClick={() => scrollToSection('hero')}
              >
                <span>GATEWAY</span>
              </button>
            </li>
            <li>
              <button
                className="nav-link-btn"
                onClick={() => scrollToSection('story')}
              >
                <span>CHRONICLES</span>
              </button>
            </li>
            <li>
              <button
                className="nav-link-btn"
                onClick={() => scrollToSection('treasure')}
              >
                <span>CHAMBER</span>
              </button>
            </li>
            <li>
              <button
                className="nav-link-btn"
                onClick={() => scrollToSection('register')}
              >
                <span>THE GUARDIAN</span>
              </button>
            </li>
          </ul>

          {/* Action CTA */}
          <div className="nav-right-actions">
            <button
              className="btn-pharaoh nav-register-btn"
              onClick={onRegisterClick}
              id="nav-register-cta"
            >
              <Sparkles size={16} />
              <span>REGISTER NOW</span>
            </button>

            {/* Mobile Hamburger */}
            <button
              className="nav-mobile-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        </div>
      </nav>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="nav-mobile-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`nav-mobile-drawer ${mobileOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Expedition Navigation Menu"
      >
        <div className="nav-drawer-header">
          <span className="drawer-glyph">𓁹</span>
          <span className="drawer-brand">{EVENT.name}</span>
          <span className="drawer-glyph">𓆣</span>
        </div>

        <div className="nav-drawer-links">
          <button className="nav-drawer-item" onClick={() => scrollToSection('hero')}>
            <Compass size={18} />
            <span>GATEWAY</span>
          </button>
          <button className="nav-drawer-item" onClick={() => scrollToSection('story')}>
            <Shield size={18} />
            <span>STORY CHRONICLES</span>
          </button>
          <button className="nav-drawer-item" onClick={() => scrollToSection('treasure')}>
            <Sparkles size={18} />
            <span>TREASURE CHAMBER</span>
          </button>
          <button className="nav-drawer-item" onClick={() => scrollToSection('register')}>
            <span className="drawer-item-glyph">𓋹</span>
            <span>THE GUARDIAN</span>
          </button>
        </div>

        <button
          className="btn-pharaoh nav-drawer-cta"
          onClick={() => { setMobileOpen(false); onRegisterClick() }}
        >
          <Sparkles size={18} />
          REGISTER NOW — JOIN EXPEDITION
        </button>
      </div>
    </>
  )
}
