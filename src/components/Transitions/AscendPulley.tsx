import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import './AscendPulley.css'

export default function AscendPulley() {
  const [visible, setVisible] = useState(false)
  const [ascending, setAscending] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 450)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const ascendToTop = () => {
    setAscending(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setTimeout(() => setAscending(false), 1000)
  }

  if (!visible) return null

  return (
    <div className={`ascend-pulley-widget ${ascending ? 'pulling' : ''}`}>
      {/* Rusted Iron Chain Links going upward */}
      <div className="pulley-chain-links" aria-hidden="true">
        <span className="p-chain-link" />
        <span className="p-chain-link" />
        <span className="p-chain-link" />
      </div>

      {/* Heavy Rusted Bronze Ascension Wheel */}
      <button
        className="ascend-pulley-btn"
        onClick={ascendToTop}
        aria-label="Ascend to Pyramid Summit (Back to Top)"
        title="Ascend to Surface"
      >
        <div className="pulley-rust-crust" />
        <div className="pulley-wheel-rim">
          <ArrowUp size={16} className="pulley-arrow" />
          <span className="pulley-subtext">ASCEND</span>
        </div>
      </button>
    </div>
  )
}
