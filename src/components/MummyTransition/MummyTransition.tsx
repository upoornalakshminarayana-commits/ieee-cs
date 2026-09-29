import { useEffect, useRef, useCallback, useMemo } from 'react'
import { gsap } from 'gsap'
import './MummyTransition.css'
import Registration from '../Registration/Registration'

interface MummyTransitionProps {
  active: boolean
  onClose: () => void
}

interface BandageConfig {
  id: number
  className: string
  startX: string
  startY: string
  startRotate: number
  startScaleX: number
  startSkewX: number
  targetX: string
  targetY: string
  targetRotate: number
  targetScaleX: number
  targetSkewX: number
  revealX: string
  revealY: string
  revealRotate: number
  revealOpacity: number
  delay: number
  duration: number
  width: string
  height: string
  top?: string
  bottom?: string
  left?: string
  right?: string
  zIndex: number
  frayCount: number
}

// 16 hyper-realistic dirty, dusted, decayed mummy bandage swaths
const BANDAGE_STRIPS: BandageConfig[] = [
  {
    id: 1,
    className: 'bandage-strip-1',
    startX: '-140%',
    startY: '-90%',
    startRotate: -48,
    startScaleX: 1.4,
    startSkewX: -15,
    targetX: '-5%',
    targetY: '-10%',
    targetRotate: -24,
    targetScaleX: 1,
    targetSkewX: -5,
    revealX: '-58%',
    revealY: '-48%',
    revealRotate: -38,
    revealOpacity: 0.95,
    delay: 0.04,
    duration: 0.85,
    width: '135vw',
    height: '20vh',
    top: '0',
    left: '0',
    zIndex: 10,
    frayCount: 22,
  },
  {
    id: 2,
    className: 'bandage-strip-2',
    startX: '140%',
    startY: '120%',
    startRotate: 38,
    startScaleX: 1.3,
    startSkewX: 12,
    targetX: '0%',
    targetY: '15%',
    targetRotate: 18,
    targetScaleX: 1,
    targetSkewX: 4,
    revealX: '58%',
    revealY: '52%',
    revealRotate: 30,
    revealOpacity: 0.95,
    delay: 0.1,
    duration: 0.9,
    width: '140vw',
    height: '22vh',
    bottom: '0',
    right: '0',
    zIndex: 11,
    frayCount: 24,
  },
  {
    id: 3,
    className: 'bandage-strip-3',
    startX: '-150%',
    startY: '0%',
    startRotate: -15,
    startScaleX: 1.5,
    startSkewX: 10,
    targetX: '0%',
    targetY: '0%',
    targetRotate: -6,
    targetScaleX: 1,
    targetSkewX: 2,
    revealX: '-68%',
    revealY: '0%',
    revealRotate: -14,
    revealOpacity: 0.92,
    delay: 0.18,
    duration: 0.8,
    width: '130vw',
    height: '24vh',
    top: '25%',
    left: '0',
    zIndex: 12,
    frayCount: 20,
  },
  {
    id: 4,
    className: 'bandage-strip-4',
    startX: '150%',
    startY: '-20%',
    startRotate: 22,
    startScaleX: 1.4,
    startSkewX: -12,
    targetX: '-5%',
    targetY: '0%',
    targetRotate: 12,
    targetScaleX: 1,
    targetSkewX: -3,
    revealX: '68%',
    revealY: '-15%',
    revealRotate: 20,
    revealOpacity: 0.92,
    delay: 0.24,
    duration: 0.85,
    width: '135vw',
    height: '26vh',
    top: '45%',
    right: '0',
    zIndex: 13,
    frayCount: 22,
  },
  {
    id: 5,
    className: 'bandage-strip-5',
    startX: '130%',
    startY: '-130%',
    startRotate: 55,
    startScaleX: 1.6,
    startSkewX: 20,
    targetX: '0%',
    targetY: '0%',
    targetRotate: 32,
    targetScaleX: 1,
    targetSkewX: 6,
    revealX: '52%',
    revealY: '-58%',
    revealRotate: 45,
    revealOpacity: 0.96,
    delay: 0.32,
    duration: 0.9,
    width: '145vw',
    height: '24vh',
    top: '0',
    right: '0',
    zIndex: 14,
    frayCount: 22,
  },
  {
    id: 6,
    className: 'bandage-strip-6',
    startX: '-130%',
    startY: '130%',
    startRotate: -45,
    startScaleX: 1.5,
    startSkewX: -18,
    targetX: '0%',
    targetY: '-5%',
    targetRotate: -28,
    targetScaleX: 1,
    targetSkewX: -5,
    revealX: '-54%',
    revealY: '54%',
    revealRotate: -40,
    revealOpacity: 0.96,
    delay: 0.38,
    duration: 0.85,
    width: '140vw',
    height: '24vh',
    bottom: '0',
    left: '0',
    zIndex: 15,
    frayCount: 20,
  },
  {
    id: 7,
    className: 'bandage-strip-7',
    startX: '-160%',
    startY: '30%',
    startRotate: 16,
    startScaleX: 1.8,
    startSkewX: -8,
    targetX: '0%',
    targetY: '0%',
    targetRotate: 8,
    targetScaleX: 1,
    targetSkewX: 0,
    revealX: '-60%',
    revealY: '25%',
    revealRotate: 15,
    revealOpacity: 0.9,
    delay: 0.46,
    duration: 0.85,
    width: '150vw',
    height: '27vh',
    top: '38%',
    left: '0',
    zIndex: 16,
    frayCount: 26,
  },
  {
    id: 8,
    className: 'bandage-strip-8',
    startX: '160%',
    startY: '-30%',
    startRotate: -18,
    startScaleX: 1.8,
    startSkewX: 14,
    targetX: '0%',
    targetY: '0%',
    targetRotate: -10,
    targetScaleX: 1,
    targetSkewX: 0,
    revealX: '60%',
    revealY: '-25%',
    revealRotate: -16,
    revealOpacity: 0.9,
    delay: 0.52,
    duration: 0.85,
    width: '150vw',
    height: '28vh',
    top: '35%',
    right: '0',
    zIndex: 17,
    frayCount: 26,
  },
  {
    id: 9,
    className: 'bandage-strip-9',
    startX: '10%',
    startY: '-140%',
    startRotate: -8,
    startScaleX: 1.2,
    startSkewX: 5,
    targetX: '0%',
    targetY: '0%',
    targetRotate: 0,
    targetScaleX: 1,
    targetSkewX: 0,
    revealX: '5%',
    revealY: '-68%',
    revealRotate: -5,
    revealOpacity: 0.98,
    delay: 0.62,
    duration: 0.8,
    width: '120vw',
    height: '38vh',
    top: '0',
    left: '-5vw',
    zIndex: 18,
    frayCount: 28,
  },
  {
    id: 10,
    className: 'bandage-strip-10',
    startX: '-10%',
    startY: '140%',
    startRotate: 8,
    startScaleX: 1.2,
    startSkewX: -6,
    targetX: '0%',
    targetY: '0%',
    targetRotate: 0,
    targetScaleX: 1,
    targetSkewX: 0,
    revealX: '-5%',
    revealY: '68%',
    revealRotate: 5,
    revealOpacity: 0.98,
    delay: 0.68,
    duration: 0.8,
    width: '120vw',
    height: '38vh',
    bottom: '0',
    left: '-5vw',
    zIndex: 19,
    frayCount: 28,
  },
  {
    id: 11,
    className: 'bandage-strip-11',
    startX: '-150%',
    startY: '-50%',
    startRotate: -32,
    startScaleX: 1.6,
    startSkewX: -10,
    targetX: '0%',
    targetY: '0%',
    targetRotate: -15,
    targetScaleX: 1,
    targetSkewX: 0,
    revealX: '-72%',
    revealY: '-30%',
    revealRotate: -25,
    revealOpacity: 0.85,
    delay: 0.76,
    duration: 0.75,
    width: '140vw',
    height: '26vh',
    top: '40%',
    left: '-10vw',
    zIndex: 20,
    frayCount: 24,
  },
  {
    id: 12,
    className: 'bandage-strip-12',
    startX: '150%',
    startY: '50%',
    startRotate: 30,
    startScaleX: 1.6,
    startSkewX: 10,
    targetX: '0%',
    targetY: '0%',
    targetRotate: 16,
    targetScaleX: 1,
    targetSkewX: 0,
    revealX: '72%',
    revealY: '30%',
    revealRotate: 24,
    revealOpacity: 0.85,
    delay: 0.82,
    duration: 0.75,
    width: '140vw',
    height: '26vh',
    top: '38%',
    right: '-10vw',
    zIndex: 21,
    frayCount: 24,
  },
  {
    id: 13,
    className: 'bandage-strip-13',
    startX: '-130%',
    startY: '0%',
    startRotate: -10,
    startScaleX: 2,
    startSkewX: 5,
    targetX: '0%',
    targetY: '0%',
    targetRotate: -4,
    targetScaleX: 1,
    targetSkewX: 0,
    revealX: '-80%',
    revealY: '0%',
    revealRotate: -12,
    revealOpacity: 0.8,
    delay: 0.9,
    duration: 0.65,
    width: '125vw',
    height: '32vh',
    top: '35%',
    left: '-10vw',
    zIndex: 22,
    frayCount: 30,
  },
  {
    id: 14,
    className: 'bandage-strip-14',
    startX: '130%',
    startY: '0%',
    startRotate: 12,
    startScaleX: 2,
    startSkewX: -5,
    targetX: '0%',
    targetY: '0%',
    targetRotate: 6,
    targetScaleX: 1,
    targetSkewX: 0,
    revealX: '80%',
    revealY: '0%',
    revealRotate: 14,
    revealOpacity: 0.8,
    delay: 0.95,
    duration: 0.65,
    width: '125vw',
    height: '32vh',
    top: '37%',
    right: '-10vw',
    zIndex: 23,
    frayCount: 30,
  },
  {
    id: 15,
    className: 'bandage-strip-15',
    startX: '-120%',
    startY: '0%',
    startRotate: 90,
    startScaleX: 1,
    startSkewX: 0,
    targetX: '0%',
    targetY: '0%',
    targetRotate: 90,
    targetScaleX: 1,
    targetSkewX: 0,
    revealX: '-18%',
    revealY: '0%',
    revealRotate: 90,
    revealOpacity: 1,
    delay: 1.05,
    duration: 0.55,
    width: '120vh',
    height: '20vw',
    top: '0',
    left: '-5vw',
    zIndex: 24,
    frayCount: 24,
  },
  {
    id: 16,
    className: 'bandage-strip-16',
    startX: '120%',
    startY: '0%',
    startRotate: -90,
    startScaleX: 1,
    startSkewX: 0,
    targetX: '0%',
    targetY: '0%',
    targetRotate: -90,
    targetScaleX: 1,
    targetSkewX: 0,
    revealX: '18%',
    revealY: '0%',
    revealRotate: -90,
    revealOpacity: 1,
    delay: 1.1,
    duration: 0.55,
    width: '120vh',
    height: '20vw',
    top: '0',
    right: '-5vw',
    zIndex: 25,
    frayCount: 24,
  },
]

export default function MummyTransition({ active, onClose }: MummyTransitionProps) {
  const overlayRef     = useRef<HTMLDivElement>(null)
  const shroudLayerRef = useRef<HTMLDivElement>(null)
  const chamberRef     = useRef<HTMLDivElement>(null)
  const stripsRef      = useRef<(HTMLDivElement | null)[]>([])
  const isRunning      = useRef(false)
  const masterTimeline = useRef<gsap.core.Timeline | null>(null)

  const prefersReduced = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  // Generate dynamic hanging frayed thread strings for each bandage
  const fraysData = useMemo(() => {
    return BANDAGE_STRIPS.map((strip) => {
      const topFrays = Array.from({ length: strip.frayCount }, (_, i) => ({
        id: `top-${strip.id}-${i}`,
        left: `${(i / (strip.frayCount - 1)) * 96 + (Math.sin(i * 3.7) * 2 + 2)}%`,
        height: `${6 + (Math.abs(Math.sin(i * 4.2)) * 14)}px`,
        width: `${1 + (i % 3 === 0 ? 1.5 : 0.8)}px`,
        angle: `${(Math.sin(i * 5.1) * 35)}deg`,
        opacity: 0.6 + (Math.sin(i * 2.3) * 0.35),
      }))

      const bottomFrays = Array.from({ length: strip.frayCount }, (_, i) => ({
        id: `bot-${strip.id}-${i}`,
        left: `${(i / (strip.frayCount - 1)) * 96 + (Math.cos(i * 3.1) * 2 + 2)}%`,
        height: `${8 + (Math.abs(Math.cos(i * 3.8)) * 16)}px`,
        width: `${1 + (i % 2 === 0 ? 1.4 : 0.8)}px`,
        angle: `${(Math.cos(i * 4.9) * 35)}deg`,
        opacity: 0.6 + (Math.cos(i * 2.7) * 0.35),
      }))

      return { topFrays, bottomFrays }
    })
  }, [])

  const runTransition = useCallback(() => {
    if (isRunning.current) return
    isRunning.current = true

    const overlay = overlayRef.current!
    const chamber = chamberRef.current!

    overlay.classList.add('active')
    document.body.style.overflow = 'hidden'

    if (prefersReduced) {
      gsap.set(chamber, { opacity: 1, scale: 1 })
      isRunning.current = false
      return
    }

    // Reset initial bandage trajectory & rotation
    BANDAGE_STRIPS.forEach((config, idx) => {
      const el = stripsRef.current[idx]
      if (el) {
        gsap.set(el, {
          x: config.startX,
          y: config.startY,
          rotation: config.startRotate,
          scaleX: config.startScaleX,
          skewX: config.startSkewX,
          opacity: 1,
          force3D: true,
        })
      }
    })

    gsap.set(chamber, { opacity: 0, scale: 0.88, y: 30 })

    const tl = gsap.timeline({
      onComplete: () => {
        isRunning.current = false
      },
    })
    masterTimeline.current = tl

    // ── Phase 1: Swarm & progressive 100% full-screen wrapping (0.0s – 1.45s) ──
    BANDAGE_STRIPS.forEach((config, idx) => {
      const el = stripsRef.current[idx]
      if (el) {
        tl.to(
          el,
          {
            x: config.targetX,
            y: config.targetY,
            rotation: config.targetRotate,
            scaleX: config.targetScaleX,
            skewX: config.targetSkewX,
            duration: config.duration,
            ease: 'power2.inOut',
            force3D: true,
          },
          config.delay
        )
      }
    })

    // ── Phase 2: Hold full mummy cloth shroud briefly (1.45s – 1.65s) ──
    tl.to({}, { duration: 0.2 }, 1.45)

    // ── Phase 3: Central Bandage Tear / Organic Parting Reveal (1.65s – 2.4s) ──
    BANDAGE_STRIPS.forEach((config, idx) => {
      const el = stripsRef.current[idx]
      if (el) {
        tl.to(
          el,
          {
            x: config.revealX,
            y: config.revealY,
            rotation: config.revealRotate,
            opacity: config.revealOpacity,
            duration: 0.85,
            ease: 'expo.out',
            force3D: true,
          },
          1.65 + (idx % 4) * 0.04
        )
      }
    })

    // ── Phase 4: Secret Tomb Registration Chamber Emerges from Darkness ──
    tl.to(
      chamber,
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
      },
      1.78
    )

  }, [prefersReduced])

  const closeTransition = useCallback(() => {
    if (masterTimeline.current) {
      masterTimeline.current.kill()
    }
    const overlay = overlayRef.current!
    const chamber = chamberRef.current!

    gsap.to(chamber, {
      opacity: 0,
      scale: 0.9,
      duration: 0.35,
      ease: 'power2.in',
    })

    // Bandages retract outward
    BANDAGE_STRIPS.forEach((config, idx) => {
      const el = stripsRef.current[idx]
      if (el) {
        gsap.to(el, {
          x: config.startX,
          y: config.startY,
          opacity: 0,
          duration: 0.45,
          ease: 'power2.in',
        })
      }
    })

    setTimeout(() => {
      overlay.classList.remove('active')
      document.body.style.overflow = ''
      isRunning.current = false
      onClose()
    }, 450)
  }, [onClose])

  useEffect(() => {
    if (active) {
      runTransition()
    } else {
      if (overlayRef.current) {
        overlayRef.current.classList.remove('active')
      }
      document.body.style.overflow = ''
    }
  }, [active, runTransition])

  // Escape key handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && active) closeTransition()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [active, closeTransition])

  return (
    <div
      ref={overlayRef}
      className="mummy-cinematic-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="KHEPRIX 2K26 Registration Chamber"
      aria-hidden={!active}
    >
      {/* ── SVG Filters for Authentic Ancient Linen Roughness, Ripped Fringes & Desert Dust ── */}
      <svg className="mummy-svg-filters" aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        <defs>
          {/* Jagged, torn, frayed ripped linen edges */}
          <filter id="mummy-ragged-edge" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.045 0.08" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
          </filter>

          {/* Heavy desert sand grit and natron dust crust texture */}
          <filter id="mummy-dust-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" result="grain" />
            <feColorMatrix
              type="matrix"
              values="0.3 0 0 0 0.8
                      0 0.25 0 0 0.7
                      0 0 0.15 0 0.5
                      0 0 0 0.65 0"
              result="coloredGrain"
            />
            <feBlend mode="overlay" in="SourceGraphic" in2="coloredGrain" />
          </filter>
        </defs>
      </svg>

      {/* ── Background Darkness & Shadow Abyss ── */}
      <div className="mummy-dark-abyss" aria-hidden="true" />

      {/* ── Dynamic Supernatural Mummy Bandages Shroud Layer ── */}
      <div ref={shroudLayerRef} className="mummy-shroud-container" aria-hidden="true">
        {BANDAGE_STRIPS.map((strip, idx) => (
          <div
            key={strip.id}
            ref={(el) => { stripsRef.current[idx] = el }}
            className={`mummy-bandage-strip ${strip.className}`}
            style={{
              width: strip.width,
              height: strip.height,
              top: strip.top,
              bottom: strip.bottom,
              left: strip.left,
              right: strip.right,
              zIndex: strip.zIndex,
            }}
          >
            {/* Decayed, weathered linen cloth surface with grime, sand dust, and coarse thread weave */}
            <div className="bandage-cloth-surface">
              {/* Thick gritty sand dust specks and natron mineral layer */}
              <div className="bandage-sand-dust-layer" />

              {/* Longitudinal & horizontal coarse linen warp/weft thread weave */}
              <div className="bandage-woven-threads" />

              {/* Hand-spun coarse thread slubs & uneven woven cords */}
              <div className="bandage-coarse-slubs" />

              {/* Dark bitumen resin burns & aged brownish embalming stains */}
              <div className="bandage-dirt-stains" />

              {/* Ancient tension creases, folds, and fabric wrinkles */}
              <div className="bandage-crease-folds" />

              {/* Decayed fabric holes & threadbare patches */}
              <div className="bandage-decay-holes" />
            </div>

            {/* Top Ragged Frayed Threads String Projections */}
            <div className="bandage-fray-fringe top-fringe">
              {fraysData[idx]?.topFrays.map((fray) => (
                <span
                  key={fray.id}
                  className="hanging-frayed-thread"
                  style={{
                    left: fray.left,
                    height: fray.height,
                    width: fray.width,
                    transform: `rotate(${fray.angle})`,
                    opacity: fray.opacity,
                  }}
                >
                  {/* Micro dust speck on tip of frayed thread */}
                  <span className="thread-dust-tip" />
                </span>
              ))}
            </div>

            {/* Bottom Ragged Frayed Threads String Projections */}
            <div className="bandage-fray-fringe bottom-fringe">
              {fraysData[idx]?.bottomFrays.map((fray) => (
                <span
                  key={fray.id}
                  className="hanging-frayed-thread"
                  style={{
                    left: fray.left,
                    height: fray.height,
                    width: fray.width,
                    transform: `rotate(${fray.angle})`,
                    opacity: fray.opacity,
                  }}
                >
                  {/* Micro dust speck on tip of frayed thread */}
                  <span className="thread-dust-tip" />
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── The Revealed Secret Tomb Registration Chamber ── */}
      <div ref={chamberRef} className="mummy-revealed-chamber">
        {/* Ancient Pharaoh Tomb Close Button */}
        <button
          className="tomb-chamber-close-btn"
          onClick={closeTransition}
          aria-label="Close Registration Chamber (Esc)"
          title="Return to Expedition (Esc)"
        >
          <span className="close-glyph">✕</span>
          <span className="close-text">ESC</span>
        </button>

        {/* The Registration Scroll Form */}
        <Registration />
      </div>
    </div>
  )
}
