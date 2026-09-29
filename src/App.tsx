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
import AdminDashboard from './components/Admin/AdminDashboard'

const checkIsAdmin = () => {
  if (typeof window === 'undefined') return false
  const p = window.location.pathname.toLowerCase()
  const h = window.location.hash.toLowerCase()
  const s = window.location.search.toLowerCase()
  return (
    p.includes('/admin') ||
    p.endsWith('admin') ||
    h.includes('admin') ||
    s.includes('admin=true') ||
    s === '?admin'
  )
}

export default function App() {
  const [loading, setLoading] = useState(true)
  const [transitionActive, setTransitionActive] = useState(false)
  const [isAdmin, setIsAdmin] = useState(checkIsAdmin)

  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdmin(checkIsAdmin())
    }
    window.addEventListener('popstate', handleLocationChange)
    window.addEventListener('hashchange', handleLocationChange)
    return () => {
      window.removeEventListener('popstate', handleLocationChange)
      window.removeEventListener('hashchange', handleLocationChange)
    }
  }, [])

  const handleExitAdmin = () => {
    if (window.location.hash.toLowerCase().includes('admin')) {
      window.location.hash = ''
    }
    if (window.location.pathname.toLowerCase().includes('admin')) {
      window.history.pushState(null, '', '/')
    }
    setIsAdmin(false)
  }

  if (isAdmin) {
    return <AdminDashboard onBackToSite={handleExitAdmin} />
  }

  const openRegistration = () => {
    if (transitionActive) return
    setTransitionActive(true)
    document.body.style.overflow = 'hidden'
    // Pause background videos when modal opens to eliminate GPU/CPU lag while user interacts with form
    document.querySelectorAll('video').forEach((v) => {
      try { v.pause() } catch {}
    })
  }

  const closeRegistration = () => {
    setTransitionActive(false)
    document.body.style.overflow = ''
    // Resume visible videos when modal closes
    document.querySelectorAll('video').forEach((v) => {
      try {
        if (v.hasAttribute('autoplay') || v.loop) {
          v.play().catch(() => {})
        }
      } catch {}
    })
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
      {!transitionActive && <AntiqueAstrolabeHUD />}

      {/* Floating Ancient Rusted Bronze Ankh Audio (Transition 8) */}
      {!transitionActive && <AncientAnkhAudio />}

      {/* Floating Ascend Pulley (Transition 10) */}
      {!transitionActive && <AscendPulley />}

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
