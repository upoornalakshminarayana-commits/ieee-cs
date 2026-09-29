import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MapPin, Calendar, Clock, Trophy, Users, Award, Sparkles, ChevronDown, Lock, Unlock } from 'lucide-react'
import './Treasure.css'
import { EVENT } from '../../data/event'

gsap.registerPlugin(ScrollTrigger)

const TreasureChest = lazy(() => import('./TreasureChest'))

export default function Treasure() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const leftBoardRef = useRef<HTMLDivElement>(null)
  const rightBoardRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [manualOverride, setManualOverride] = useState<number | null>(null)

  const openProgress = manualOverride !== null ? manualOverride : scrollProgress

  const prefersReduced = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  useEffect(() => {
    if (prefersReduced) {
      setScrollProgress(1)
      return
    }

    const ctx = gsap.context(() => {
      // Header entrance
      gsap.from(headerRef.current, {
        opacity: 0,
        y: 40,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: headerRef.current,
          start: 'top 85%',
          once: true,
        },
      })

      // Continuous Scroll-driven chest open and close (Bidirectional)
      ScrollTrigger.create({
        trigger: canvasRef.current,
        start: 'top 75%',
        end: 'bottom 25%',
        scrub: 1.2,
        onUpdate: (self) => {
          if (manualOverride === null) {
            setScrollProgress(self.progress)
          }
          if (glowRef.current) {
            const p = self.progress
            glowRef.current.style.opacity = (p * 0.95).toString()
          }
        },
      })

      // Flanking Egyptian Steles
      gsap.from(leftBoardRef.current, {
        opacity: 0,
        x: -50,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: leftBoardRef.current,
          start: 'top 85%',
          once: true,
        },
      })

      gsap.from(rightBoardRef.current, {
        opacity: 0,
        x: 50,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: rightBoardRef.current,
          start: 'top 85%',
          once: true,
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [prefersReduced, manualOverride])

  const toggleManualOpen = () => {
    if (manualOverride === null) {
      setManualOverride(openProgress > 0.5 ? 0 : 1)
    } else {
      setManualOverride(manualOverride === 1 ? 0 : 1)
    }
  }

  return (
    <section
      ref={sectionRef}
      id="treasure"
      className="treasure-section pylon-section"
      aria-label="The Sacred Treasure Chamber"
    >
      {/* Background with user custom image + dark tomb gradient */}
      <div className="treasure-bg-layer" aria-hidden="true" />
      <div ref={glowRef} className="treasure-radial-glow" style={{ opacity: 0 }} aria-hidden="true" />

      {/* ── Section Header ── */}
      <div ref={headerRef} className="treasure-header">
        <div className="treasure-cartouche-tag">
          <span>𓁹</span>
          <span>THE PHARAOH'S VAULT</span>
          <span>𓆣</span>
        </div>
        <h2 className="treasure-main-title">THE SACRED<br />TREASURE CHAMBER</h2>
        <div className="pharaoh-divider">
          <span className="pharaoh-divider-emblem">𓋹</span>
        </div>
        <p className="treasure-subtext">
          Scroll down to unseal the chest, or click to inspect the legendary relics inside.
        </p>
      </div>

      {/* ── 3D Majestic Chest Canvas ── */}
      <div ref={canvasRef} className="treasure-canvas-wrapper" aria-label="Interactive 3D Treasure Chest">
        <Suspense fallback={
          <div className="treasure-loader">
            <Sparkles className="treasure-loader-icon" />
            <span>SUMMONING ANCIENT ARTIFACT...</span>
          </div>
        }>
          <TreasureChest openProgress={openProgress} />
        </Suspense>

        {/* Chest Interactive Controls Overlay */}
        <div className="treasure-interactive-bar">
          <button 
            className="treasure-toggle-btn"
            onClick={toggleManualOpen}
            aria-label={openProgress > 0.5 ? "Seal Chest" : "Unseal Chest"}
          >
            {openProgress > 0.5 ? <Lock size={15} /> : <Unlock size={15} />}
            <span>{openProgress > 0.5 ? 'SEAL CHEST' : 'UNSEAL CHEST'}</span>
          </button>
          
          <div className="treasure-scroll-hint">
            <ChevronDown size={14} className="hint-arrow" />
            <span>{openProgress < 0.2 ? 'SCROLL DOWN TO UNSEAL' : openProgress < 0.85 ? 'UNSEALING...' : 'TREASURE UNLOCKED'}</span>
          </div>
        </div>
      </div>

      {/* ── Egyptian Stone Steles Layout (Venue Photo & Highlighted Gains) ── */}
      <div className="treasure-steles-grid">
        
        {/* LEFT STELE — Venue Photo & Expedition Logistics */}
        <div ref={leftBoardRef} className="egyptian-stele treasure-stele-card venue-stele-card" aria-label="Expedition details">
          <div className="stele-header">
            <span className="stele-glyph">𓊹</span>
            <h3 className="stele-title">EXPEDITION TOMB VENUE</h3>
            <span className="stele-glyph">𓊹</span>
          </div>
          <div className="stele-divider" />

          {/* Real Excavation Venue Photo with Antique Cartouche Border */}
          <div className="venue-photo-container">
            <img 
              src={EVENT.venue.image} 
              alt="Srinivasa Ramanujam Block — Venue" 
              className="venue-block-photo"
              loading="lazy"
            />
            <div className="venue-photo-overlay" />
            <div className="venue-photo-badge">
              <span className="badge-glyph">𓁹</span>
              <span>SRINIVASA RAMANUJAM BLOCK</span>
            </div>
          </div>

          <div className="stele-info-grid">
            <div className="stele-info-item">
              <MapPin className="stele-icon" size={20} />
              <div>
                <p className="stele-label">VENUE &amp; HALLS</p>
                <p className="stele-value">{EVENT.venue.name}</p>
                <p className="stele-subvalue highlight-rooms">{EVENT.venue.rooms}</p>
              </div>
            </div>

            <div className="stele-info-item">
              <Calendar className="stele-icon" size={20} />
              <div>
                <p className="stele-label">EXPEDITION DATE</p>
                <p className="stele-value gold-text">{EVENT.date}</p>
              </div>
            </div>

            <div className="stele-info-item">
              <Clock className="stele-icon" size={20} />
              <div>
                <p className="stele-label">EXPEDITION TIME</p>
                <p className="stele-value">{EVENT.time}</p>
              </div>
            </div>

            <div className="stele-info-item">
              <Users className="stele-icon" size={20} />
              <div>
                <p className="stele-label">TEAM SQUAD SIZE</p>
                <p className="stele-value">{EVENT.teamSize}</p>
              </div>
            </div>
          </div>

          <div className="stele-bounty-badge">
            <Trophy size={20} className="bounty-icon" />
            <div>
              <span className="bounty-label">TOTAL EXPEDITION BOUNTY</span>
              <span className="bounty-val">IEEE MEMBERSHIPS &amp; ₹1,500 CASH PRIZE</span>
            </div>
          </div>
        </div>

        {/* RIGHT STELE — Highlighted Academic Credits & Participant Gains */}
        <div ref={rightBoardRef} className="egyptian-stele treasure-stele-card gains-stele-card" aria-label="Academic Credits and Gains">
          <div className="stele-header">
            <span className="stele-glyph">𓆣</span>
            <h3 className="stele-title">WHAT EXPLORERS GAIN</h3>
            <span className="stele-glyph">𓆣</span>
          </div>
          <div className="stele-divider" />

          <p className="gains-intro-text">
            Championship expedition prizes, official IEEE memberships, and institutional university credits:
          </p>

          <div className="gains-cards-stack">
            
            {/* 1ST PRIZE — IEEE MEMBERSHIP */}
            <div className="gain-highlight-card first-prize-card">
              <div className="gain-card-header">
                <span className="gain-year-pill prize-pill gold-pill">🥇 1ST PRIZE</span>
                <span className="gain-seal-icon">𓁹</span>
              </div>
              <div className="gain-card-body">
                <div className="gain-reward-badge gold-glow">
                  <Trophy size={18} className="gain-badge-icon" />
                  <span className="gain-reward-text">1ST PRIZE — IEEE MEMBERSHIP</span>
                </div>
                <p className="gain-desc">
                  The winning team will receive <strong>IEEE Membership</strong>.
                </p>
              </div>
            </div>

            {/* 2ND PRIZE — IEEE MEMBERSHIP */}
            <div className="gain-highlight-card second-prize-card">
              <div className="gain-card-header">
                <span className="gain-year-pill prize-pill silver-pill">🥈 2ND PRIZE</span>
                <span className="gain-seal-icon">𓆣</span>
              </div>
              <div className="gain-card-body">
                <div className="gain-reward-badge electric-gold-glow">
                  <Award size={18} className="gain-badge-icon" />
                  <span className="gain-reward-text">2ND PRIZE — IEEE MEMBERSHIP</span>
                </div>
                <p className="gain-desc">
                  The second-place team will receive <strong>IEEE Membership</strong>.
                </p>
              </div>
            </div>

            {/* 3RD PRIZE — ₹1,500 CASH PRIZE */}
            <div className="gain-highlight-card third-prize-card">
              <div className="gain-card-header">
                <span className="gain-year-pill prize-pill bronze-pill">🥉 3RD PRIZE</span>
                <span className="gain-seal-icon">𓊹</span>
              </div>
              <div className="gain-card-body">
                <div className="gain-reward-badge bronze-glow">
                  <Sparkles size={18} className="gain-badge-icon" />
                  <span className="gain-reward-text">3RD PRIZE — ₹1,500 CASH PRIZE</span>
                </div>
                <p className="gain-desc">
                  The third-place team will receive a <strong>₹1,500 cash prize</strong>.
                </p>
              </div>
            </div>

            {/* Academic Perks Footnote */}
            <div className="gains-perks-banner">
              <span className="perks-glyph">𓋹</span>
              <span className="perks-text"><strong>Academic Rewards:</strong> Group 3 Certificate (2nd Yr) &amp; 2 EE Credits (3rd &amp; 4th Yr) for all eligible explorers.</span>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}
