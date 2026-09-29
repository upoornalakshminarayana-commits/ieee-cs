import { useEffect, useRef, useState } from 'react'
import './Story.css'
import { KHEPRIX_VIDEOS } from '../../data/videos'
import { useIsMobile } from '../../hooks/useIsMobile'

export default function Story() {
  const isMobile = useIsMobile(768)
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [inView, setInView] = useState(false)

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

    // Seamless restart on ended
    const handleEnded = () => {
      video.currentTime = 0
      if (inView) video.play().catch(() => {})
    }

    // Near-end pre-emptive loop check
    const handleTimeUpdate = () => {
      if (video.duration && video.currentTime >= video.duration - 0.15) {
        video.currentTime = 0
        if (inView) video.play().catch(() => {})
      }
    }

    // Visibility restore
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

  return (
    <section
      ref={sectionRef}
      id="story"
      className="story-section"
      aria-label="The Ancient Expedition Story Map"
    >
      {/* ── Maximum Width Looping Story Map Video — Responsive Desktop & Mobile ── */}
      <div className="story-video-fullscreen-wrapper">
        <video
          key={isMobile ? 'story-mobile-vid' : 'story-desktop-vid'}
          ref={videoRef}
          className="story-fullscreen-video"
          autoPlay={inView}
          muted
          loop
          playsInline
          preload="metadata"
          disablePictureInPicture
          aria-label="Explorers animating across ancient parchment map (Spots 1 through 6)"
        >
          <source src={isMobile ? KHEPRIX_VIDEOS.story.mobile : KHEPRIX_VIDEOS.story.desktop} type="video/mp4" />
          <source src={isMobile ? KHEPRIX_VIDEOS.story.urlMobile : KHEPRIX_VIDEOS.story.urlDesktop} type="video/mp4" />
          {!isMobile && <source src="/assets/story_map_video.mp4" type="video/mp4" />}
        </video>
      </div>
    </section>
  )
}
