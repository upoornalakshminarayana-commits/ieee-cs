import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './RustedSeamDivider.css'

gsap.registerPlugin(ScrollTrigger)

export default function RustedSeamDivider() {
  const dividerRef = useRef<HTMLDivElement>(null)
  const leftPlateRef = useRef<HTMLDivElement>(null)
  const rightPlateRef = useRef<HTMLDivElement>(null)
  const sealRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const divider = dividerRef.current
    const leftPlate = leftPlateRef.current
    const rightPlate = rightPlateRef.current
    const seal = sealRef.current
    if (!divider || !leftPlate || !rightPlate || !seal) return

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: divider,
        start: 'top 85%',
        end: 'bottom 40%',
        scrub: 1,
      },
    })

    tl.to(leftPlate, { x: '-8%', rotation: -1.5, ease: 'none' }, 0)
    tl.to(rightPlate, { x: '8%', rotation: 1.5, ease: 'none' }, 0)
    tl.to(seal, { scale: 1.15, rotation: 180, ease: 'none' }, 0)

    return () => {
      tl.kill()
    }
  }, [])

  return (
    <div ref={dividerRef} className="rusted-seam-divider" aria-hidden="true">
      {/* Left Rusted Stone Slab */}
      <div ref={leftPlateRef} className="rusted-seam-plate left-plate">
        <div className="plate-rust-crust" />
        <div className="plate-hieroglyphs">𓀀 𓁐 𓁹 𓆣 𓋹 𓊹 𓌃 𓎛</div>
        <div className="rusted-iron-studs">
          <span className="iron-stud" />
          <span className="iron-stud" />
          <span className="iron-stud" />
        </div>
      </div>

      {/* Central Rusted Bronze Scarab Seal */}
      <div ref={sealRef} className="rusted-seam-seal">
        <div className="seal-bronze-ring">
          <span className="seal-glyph">𓆣</span>
        </div>
        <div className="seal-verdigris-glow" />
      </div>

      {/* Right Rusted Stone Slab */}
      <div ref={rightPlateRef} className="rusted-seam-plate right-plate">
        <div className="plate-rust-crust" />
        <div className="plate-hieroglyphs">𓎛 𓌃 𓊹 𓋹 𓆣 𓁹 𓁐 𓀀</div>
        <div className="rusted-iron-studs">
          <span className="iron-stud" />
          <span className="iron-stud" />
          <span className="iron-stud" />
        </div>
      </div>
    </div>
  )
}
