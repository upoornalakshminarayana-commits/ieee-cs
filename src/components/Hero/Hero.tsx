import { useEffect, useRef, useState } from 'react'
import { Sparkles, ChevronDown } from 'lucide-react'
import './Hero.css'
import { KHEPRIX_VIDEOS } from '../../data/videos'
import { useIsMobile } from '../../hooks/useIsMobile'

interface HeroProps {
  onRegisterClick: () => void
}

export default function Hero({ onRegisterClick }: HeroProps) {
  const isMobile = useIsMobile(768)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [kluLogoSrc, setKluLogoSrc] = useState('/assets/kalasalingam_logo.png')

  // Smooth scroll to the Expedition Chronicles story section
  const scrollToNext = () => {
    const nextSection = document.getElementById('story')
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Convert Kalasalingam black background to pure white on canvas
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = '/assets/kalasalingam_logo.png'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.drawImage(img, 0, 0)
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imgData.data

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          if (r < 38 && g < 38 && b < 38) {
            data[i] = 255
            data[i + 1] = 255
            data[i + 2] = 255
            data[i + 3] = 255
          }
        }
        ctx.putImageData(imgData, 0, 0)
        setKluLogoSrc(canvas.toDataURL('image/png'))
      } catch {
        // Fallback to original
      }
    }
  }, [])

  // Bulletproof Continuous Non-Stop Looping Engine
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    video.playsInline = true
    video.loop = true

    const ensurePlay = () => {
      if (video.paused) {
        video.play().catch(() => {})
      }
    }

    ensurePlay()

    // Seamless restart on ended
    const handleEnded = () => {
      video.currentTime = 0
      video.play().catch(() => {})
    }

    // Near-end pre-emptive loop check
    const handleTimeUpdate = () => {
      if (video.duration && video.currentTime >= video.duration - 0.15) {
        video.currentTime = 0
        video.play().catch(() => {})
      }
    }

    // Window focus / visibility restore
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        ensurePlay()
      }
    }

    // First interaction fallback for strict autoplay policies
    const handleInteraction = () => {
      ensurePlay()
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
  }, [isMobile])

  return (
    <section id="hero" className="hero-section" aria-label="Expedition Live Canvas">
      {/* ── Native Animated Landing Video — Responsive Desktop & Mobile Selection ── */}
      <video
        key={isMobile ? 'hero-mobile-vid' : 'hero-desktop-vid'}
        ref={videoRef}
        className="hero-video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        aria-hidden="true"
      >
        <source src={isMobile ? KHEPRIX_VIDEOS.hero.mobile : KHEPRIX_VIDEOS.hero.desktop} type="video/mp4" />
        <source src={isMobile ? KHEPRIX_VIDEOS.hero.urlMobile : KHEPRIX_VIDEOS.hero.urlDesktop} type="video/mp4" />
        {!isMobile && <source src="/assets/landing_video.mp4" type="video/mp4" />}
      </video>

      {/* ── Top Left Logo — IEEE Computer Society KARE ── */}
      <div className="hero-top-left-badge" aria-label="IEEE Computer Society KARE">
        <img
          src="/assets/ieee_logo.png"
          alt="IEEE Computer Society KARE"
          className="hero-logo-img hero-ieee-img"
        />
      </div>

      {/* ── Top Right Logo — Kalasalingam University (Enlarged + White Background) ── */}
      <div className="hero-top-right-badge" aria-label="Kalasalingam Academy of Research and Education">
        <img
          src={kluLogoSrc}
          alt="Kalasalingam Academy of Research and Education"
          className="hero-logo-img hero-klu-img"
        />
      </div>

      {/* ── Center Register Now CTA Button ── */}
      <div className="hero-cta-wrapper">
        <button
          className="btn-pharaoh hero-register-only-btn"
          onClick={onRegisterClick}
          id="hero-register-btn"
          aria-label="Register Now for KHEPRIX 2K26"
        >
          <Sparkles size={20} className="btn-sparkle-icon" />
          REGISTER NOW
          <span className="btn-glyph-suffix">𓆣</span>
        </button>
      </div>

      {/* ── Antique Expedition Navigation Marker / Dedicated Scroll Down Control ── */}
      <button
        className="hero-scroll-control"
        onClick={scrollToNext}
        aria-label="Scroll down to explore the Ancient Chronicles"
        id="hero-scroll-down-btn"
        title="Scroll down to explore Chronicles"
      >
        <div className="hero-scroll-patina" aria-hidden="true" />
        <span className="hero-scroll-glyph" aria-hidden="true">𓆣</span>
        <div className="hero-scroll-content">
          <span className="hero-scroll-title">SCROLL DOWN</span>
          <span className="hero-scroll-sub">EXPLORE CHRONICLES</span>
        </div>
        <div className="hero-scroll-icon-wrap" aria-hidden="true">
          <ChevronDown size={14} className="hero-scroll-chevron" />
        </div>
      </button>
    </section>
  )
}
