import { useState, useEffect } from 'react'
import Loader from './components/Loader/Loader'
import Navigation from './components/Navigation/Navigation'
import Hero from './components/Hero/Hero'
import Story from './components/Story/Story'
import Treasure from './components/Treasure/Treasure'
import Register from './components/Register/Register'
import Footer from './components/Footer/Footer'
import MummyTransition from './components/MummyTransition/MummyTransition'
import RustedSeamDivider from './components/Transitions/RustedSeamDivider'
import RustedTombGates from './components/Transitions/RustedTombGates'
import AntiqueAstrolabeHUD from './components/Transitions/AntiqueAstrolabeHUD'
import AncientAnkhAudio from './components/Transitions/AncientAnkhAudio'
import AscendPulley from './components/Transitions/AscendPulley'

export default function App() {
  const [loading, setLoading] = useState(true)
  const [transitionActive, setTransitionActive] = useState(false)

  const openRegistration = () => {
    if (transitionActive) return
    setTransitionActive(true)
    document.body.style.overflow = 'hidden'
  }

  const closeRegistration = () => {
    setTransitionActive(false)
    document.body.style.overflow = ''
  }

  useEffect(() => {
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <>
      {/* ── Initial Mummy Start Loader (Responsive Desktop / Mobile) ── */}
      {loading && (
        <Loader onFinish={() => setLoading(false)} />
      )}

      {/* Navigation */}
      <Navigation onRegisterClick={openRegistration} />

      {/* Floating Antique Astrolabe HUD Navigator (Transition 7) */}
      <AntiqueAstrolabeHUD />

      {/* Floating Ancient Rusted Bronze Ankh Audio (Transition 8) */}
      <AncientAnkhAudio />

      {/* Floating Ascend Pulley (Transition 10) */}
      <AscendPulley />

      {/* Main page journey */}
      <main id="main-content">
        {/* SECTION 1 — Hero */}
        <Hero onRegisterClick={openRegistration} />

        {/* Transition 1: Rusted Stone & Bronze Seam Divider */}
        <RustedSeamDivider />

        {/* SECTION 2 — Story */}
        <Story />

        {/* Transition 2: Rusted Iron Tomb Gates Portal */}
        <RustedTombGates />

        {/* SECTION 3 — Treasure Chamber */}
        <Treasure />

        {/* SECTION 4 — Final Register */}
        <Register onRegisterClick={openRegistration} />
      </main>

      {/* Footer */}
      <Footer />

      {/* Mummy transition + Registration modal */}
      <MummyTransition
        active={transitionActive}
        onClose={closeRegistration}
      />
    </>
  )
}
