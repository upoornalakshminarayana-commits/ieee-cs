import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Sparkles, Skull, Compass, ShieldCheck } from 'lucide-react'
import './Register.css'
import { KHEPRIX_VIDEOS } from '../../data/videos'
import { useIsMobile } from '../../hooks/useIsMobile'

gsap.registerPlugin(ScrollTrigger)

interface RegisterProps {
  onRegisterClick: () => void
}

export default function Register({ onRegisterClick }: RegisterProps) {
  const isMobile = useIsMobile(768)
  const sectionRef = useRef<HTMLElement>(null)
  const leftRef    = useRef<HTMLDivElement>(null)
  const rightRef   = useRef<HTMLDivElement>(null)
  const videoRef   = useRef<HTMLVideoElement>(null)
  const [inView, setInView] = useState(false)
  const [plaqueActive, setPlaqueActive] = useState(false)

  // IntersectionObserver: Lazy load and pause when off-screen to save GPU and battery
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
      },
      {
        threshold: 0.1,
        rootMargin: '200px 0px',
      }
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  // Play/pause based on viewport intersection
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (inView) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [inView])

  // Bulletproof Continuous Non-Stop Looping Engine
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    video.playsInline = true
    video.loop = true

    const ensurePlay = () => {
      if (inView && video.paused) {
        video.play().catch(() => {})
      }
    }

    if (inView) {
      ensurePlay()
    }

    const handleEnded = () => {
      video.currentTime = 0
      if (inView) video.play().catch(() => {})
    }

    const handleTimeUpdate = () => {
      if (video.duration && video.currentTime >= video.duration - 0.15) {
        video.currentTime = 0
        if (inView) video.play().catch(() => {})
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && inView) {
        ensurePlay()
      }
    }

    const handleInteraction = () => {
      if (inView) ensurePlay()
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('touchstart', handleInteraction)
    }

    video.addEventListener('ended', handleEnded)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('pause', ensurePlay)
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('click', handleInteraction, { once: true })
    window.addEventListener('touchstart', handleInteraction, { once: true })

    return () => {
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('pause', ensurePlay)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [isMobile, inView])

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      gsap.from(leftRef.current, {
        opacity: 0,
        x: -40,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: { trigger: leftRef.current, start: 'top 80%', once: true },
      })
      gsap.from(rightRef.current, {
        opacity: 0,
        x: 40,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: { trigger: rightRef.current, start: 'top 80%', once: true },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const triggerPlaque = () => {
    setPlaqueActive(true)
    setTimeout(() => setPlaqueActive(false), 800)
  }

  return (
    <section
      ref={sectionRef}
      id="register"
      className="final-register-section"
      aria-label="Expedition Final Challenge and Registration"
    >
      <div className="final-register-container">
        
        {/* ── LEFT — Video covering the full card layout + Dare to Enter Signboard ── */}
        <div ref={leftRef} className="final-register-left egyptian-stele">
          
          {/* Edge-to-Edge Full Card Video — Responsive Desktop & Mobile Selection */}
          <video
            key={isMobile ? 'reg-mobile-vid' : 'reg-desktop-vid'}
            ref={videoRef}
            className="final-mummy-full-video"
            autoPlay={inView}
            muted
            loop
            playsInline
            preload="metadata"
            disablePictureInPicture
            aria-label="The Awakened Mummy Guardian"
          >
            <source src={isMobile ? KHEPRIX_VIDEOS.registration.mobile : KHEPRIX_VIDEOS.registration.desktop} type="video/mp4" />
            <source src={isMobile ? KHEPRIX_VIDEOS.registration.urlMobile : KHEPRIX_VIDEOS.registration.urlDesktop} type="video/mp4" />
            {!isMobile && <source src="/assets/mummy_guardian_video.mp4" type="video/mp4" />}
            <source src="/assets/story_map_video.mp4" type="video/mp4" />
          </video>

          {/* Seamless bottom gradation */}
          <div className="final-mummy-overlay" aria-hidden="true" />

          {/* DARE TO ENTER Signboard / Plaque layered over bottom */}
          <div 
            className={`dare-signboard ${plaqueActive ? 'plaque-blood-flicker' : ''}`}
            onClick={triggerPlaque}
            onMouseEnter={triggerPlaque}
            role="button"
            tabIndex={0}
            aria-label="Dare to Enter Warning Plaque"
          >
            <div className="signboard-rust-corrosion" />
            <div className="dare-warning-tag">
              <Skull size={15} />
              <span>THE GUARDIAN AWAITS</span>
            </div>
            
            <h2 className="dare-main-title">
              DARE TO <span className="gold-gradient-text">ENTER?</span>
            </h2>
            
            <p className="dare-text">
              The pyramid gates are closing. Only the quickest minds and bravest squads will solve the hieroglyphic riddles and claim the Pharaoh's Gold.
            </p>

            <div className="dare-sigil-band">
              <span>𓁹</span>
              <span>𓆣</span>
              <span>𓋹</span>
              <span>𓊹</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT — Expedition Registration Information & CTA ── */}
        <div ref={rightRef} className="final-register-right egyptian-stele">
          <div className="final-right-header">
            <span className="final-glyph">𓆣</span>
            <span className="final-eyebrow">ROYAL EXPEDITION ARCHIVES</span>
            <span className="final-glyph">𓆣</span>
          </div>

          <h3 className="final-right-title">CLAIM YOUR PLACE IN THE TOMB</h3>
          <div className="stele-divider" />

          {/* Simple Event Instructions */}
          <div className="event-instructions-card">
            <ol className="expedition-steps-list">
              <li className="expedition-step-item">
                <span className="step-num-badge">I</span>
                <div>
                  <strong className="step-heading">Form Your Squad (4 Members)</strong>
                  <p className="step-body">
                    Assemble a 4-member expedition team of quick minds ready to solve logic puzzles, strategy ciphers, and ancient riddles.
                  </p>
                </div>
              </li>

              <li className="expedition-step-item">
                <span className="step-num-badge">II</span>
                <div>
                  <strong className="step-heading">Report to Venue on October 2nd</strong>
                  <p className="step-body">
                    Arrive at <strong>Srinivasa Ramanujam Block (Rooms 8501 &amp; 8601)</strong> by 9:00 AM for the briefing and map kit distribution.
                  </p>
                </div>
              </li>

              <li className="expedition-step-item">
                <span className="step-num-badge">III</span>
                <div>
                  <strong className="step-heading">Conquer the Pharaoh's Trials</strong>
                  <p className="step-body">
                    Navigate through cipher decryption, labyrinth chamber maze stages, and time-locked relic unsealing challenges.
                  </p>
                </div>
              </li>

              <li className="expedition-step-item">
                <span className="step-num-badge">IV</span>
                <div>
                  <strong className="step-heading">Claim IEEE Memberships &amp; Cash Prizes</strong>
                  <p className="step-body">
                    Compete for 1st &amp; 2nd Prize IEEE Memberships, 3rd Prize ₹1,500 Cash Prize, plus Group 3 Certificate (2nd yr) or 2 EE Credits (3rd &amp; 4th yr).
                  </p>
                </div>
              </li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="final-cta-cluster">
            <button
              className="btn-pharaoh final-main-btn"
              onClick={onRegisterClick}
              id="final-register-btn"
            >
              <Sparkles size={18} />
              REGISTER NOW — UNSEAL FORM
            </button>

            <button
              className="btn-pharaoh-secondary final-sub-btn"
              onClick={() => document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Compass size={16} />
              REPLAY STORY MAP
            </button>
          </div>

          <div className="final-guarantee">
            <ShieldCheck size={16} className="guarantee-icon" />
            <span>Official Certificates &amp; Relics for all Registered Participants</span>
          </div>

        </div>

      </div>
    </section>
  )
}
