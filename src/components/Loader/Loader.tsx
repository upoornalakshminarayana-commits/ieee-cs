import { useEffect, useRef, useState, useCallback } from 'react'
import { Sparkles, ArrowRight } from 'lucide-react'
import './Loader.css'
import { KHEPRIX_VIDEOS } from '../../data/videos'
import { useIsMobile } from '../../hooks/useIsMobile'

interface LoaderProps {
  onFinish: () => void
}

export default function Loader({ onFinish }: LoaderProps) {
  const isMobile = useIsMobile(768)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [fading, setFading] = useState(false)
  const finishedRef = useRef(false)

  const completeLoader = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    setFading(true)
    setTimeout(() => {
      onFinish()
    }, 750)
  }, [onFinish])

  // Lock scroll while loader is active
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Start playback and set fallback safety timer
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.muted = true
      video.playsInline = true
      video.play().catch(() => {})
    }

    // Safety timeout: automatically finish after 5.5s so loader never gets stuck
    const safetyTimer = setTimeout(() => {
      completeLoader()
    }, 5500)

    return () => clearTimeout(safetyTimer)
  }, [completeLoader, isMobile])

  return (
    <div
      className={`kheprix-loader-root ${fading ? 'loader-fading' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="KHEPRIX 2K26 Initial Mummy Expedition Entrance"
    >
      <div className="kheprix-loader-video-wrap">
        <video
          key={isMobile ? 'loader-mobile' : 'loader-desktop'}
          ref={videoRef}
          className="kheprix-loader-video"
          autoPlay
          muted
          playsInline
          preload="auto"
          onEnded={completeLoader}
          disablePictureInPicture
          disableRemotePlayback
          aria-hidden="true"
        >
          <source src={isMobile ? KHEPRIX_VIDEOS.loader.mobile : KHEPRIX_VIDEOS.loader.desktop} type="video/mp4" />
          <source src={isMobile ? KHEPRIX_VIDEOS.loader.urlMobile : KHEPRIX_VIDEOS.loader.urlDesktop} type="video/mp4" />
        </video>
      </div>

      <div className="kheprix-loader-vignette" aria-hidden="true" />

      {/* Bottom overlay with quick skip / enter */}
      <div className="kheprix-loader-ui">
        <div className="loader-badge-tag">
          <span className="loader-scarab">𓆣</span>
          <span>ENTERING THE EXPEDITION...</span>
        </div>

        <button
          type="button"
          className="loader-skip-btn"
          onClick={completeLoader}
          aria-label="Skip intro and enter KHEPRIX 2K26"
        >
          <Sparkles size={15} />
          <span>ENTER EXPEDITION</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
