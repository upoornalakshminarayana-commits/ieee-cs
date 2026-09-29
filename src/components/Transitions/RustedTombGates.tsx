import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './RustedTombGates.css'

gsap.registerPlugin(ScrollTrigger)

export default function RustedTombGates() {
  const containerRef = useRef<HTMLDivElement>(null)
  const leftGateRef = useRef<HTMLDivElement>(null)
  const rightGateRef = useRef<HTMLDivElement>(null)
  const chainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const leftGate = leftGateRef.current
    const rightGate = rightGateRef.current
    const chain = chainRef.current
    if (!container || !leftGate || !rightGate || !chain) return

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top 80%',
        end: 'bottom 20%',
        scrub: 1.2,
      },
    })

    // Rusted iron gates slide apart with heavy stone resistance
    tl.to(leftGate, { x: '-65%', opacity: 0.85, ease: 'power1.inOut' }, 0)
    tl.to(rightGate, { x: '65%', opacity: 0.85, ease: 'power1.inOut' }, 0)
    tl.to(chain, { scaleY: 0, opacity: 0, ease: 'power2.in' }, 0)

    return () => {
      tl.kill()
    }
  }, [])

  return (
    <div ref={containerRef} className="rusted-tomb-gates-portal" aria-hidden="true">
      {/* Heavy Rusted Iron Left Gate */}
      <div ref={leftGateRef} className="tomb-iron-gate left-gate">
        <div className="gate-iron-bars">
          <span className="iron-bar" />
          <span className="iron-bar" />
          <span className="iron-bar" />
          <span className="iron-bar" />
        </div>
        <div className="gate-cross-beam top-beam" />
        <div className="gate-cross-beam bottom-beam" />
        <div className="gate-rust-patina" />
      </div>

      {/* Rusted Hanging Iron Chains & Lock */}
      <div ref={chainRef} className="tomb-rusted-chains">
        <div className="chain-link" />
        <div className="chain-link" />
        <div className="chain-link" />
        <div className="rusted-padlock">
          <span className="lock-glyph">𓋹</span>
        </div>
      </div>

      {/* Heavy Rusted Iron Right Gate */}
      <div ref={rightGateRef} className="tomb-iron-gate right-gate">
        <div className="gate-iron-bars">
          <span className="iron-bar" />
          <span className="iron-bar" />
          <span className="iron-bar" />
          <span className="iron-bar" />
        </div>
        <div className="gate-cross-beam top-beam" />
        <div className="gate-cross-beam bottom-beam" />
        <div className="gate-rust-patina" />
      </div>
    </div>
  )
}
