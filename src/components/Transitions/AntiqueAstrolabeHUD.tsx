import { useEffect, useState } from 'react'
import './AntiqueAstrolabeHUD.css'

interface SectionNode {
  id: string
  label: string
  glyph: string
  angle: number
}

const SECTIONS: SectionNode[] = [
  { id: 'hero', label: 'GATEWAY', glyph: '𓁹', angle: 0 },
  { id: 'story', label: 'CHRONICLES', glyph: '𓆣', angle: 90 },
  { id: 'treasure', label: 'VAULT', glyph: '𓋹', angle: 180 },
  { id: 'register', label: 'GUARDIAN', glyph: '𓊹', angle: 270 },
]

export default function AntiqueAstrolabeHUD() {
  const [activeSection, setActiveSection] = useState('hero')
  const [rotationAngle, setRotationAngle] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight * 0.45
      
      for (const section of SECTIONS) {
        const el = document.getElementById(section.id)
        if (el) {
          const top = el.offsetTop
          const height = el.offsetHeight
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section.id)
            setRotationAngle(section.angle)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="antique-astrolabe-hud" role="navigation" aria-label="Egyptian Astrolabe Navigation HUD">
      <div className="astrolabe-bracket">
        
        {/* Outer Rusted Bronze Astrolabe Ring */}
        <div 
          className="astrolabe-outer-ring"
          style={{ transform: `rotate(${rotationAngle}deg)` }}
        >
          <div className="astrolabe-verdigris-crust" />
          <div className="astrolabe-teeth" />
          
          {/* Section Marker Points */}
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              className={`astrolabe-node-marker marker-${sec.id} ${activeSection === sec.id ? 'active' : ''}`}
              onClick={() => scrollTo(sec.id)}
              aria-label={`Jump to ${sec.label}`}
              title={sec.label}
            >
              <span className="node-glyph">{sec.glyph}</span>
            </button>
          ))}
        </div>

        {/* Inner Sundial Core */}
        <div className="astrolabe-sundial-core">
          <div className="sundial-needle" style={{ transform: `rotate(${-rotationAngle}deg)` }} />
          <span className="sundial-pharaoh-eye">𓁹</span>
        </div>

        {/* Active Section Label Tooltip */}
        <div className="astrolabe-section-tag">
          <span className="tag-label">
            {SECTIONS.find(s => s.id === activeSection)?.label}
          </span>
        </div>

      </div>
    </div>
  )
}
