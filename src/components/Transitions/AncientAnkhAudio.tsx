import { useState, useRef, useEffect } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import './AncientAnkhAudio.css'

export default function AncientAnkhAudio() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [rippling, setRippling] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)

  const stopAudio = () => {
    if (masterGainRef.current && audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime
      masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, now)
      masterGainRef.current.gain.linearRampToValueAtTime(0.0001, now + 0.6)
      setTimeout(() => {
        if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
          audioCtxRef.current.suspend().catch(() => {})
        }
      }, 600)
    }
  }

  const startAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!audioCtxRef.current) {
        const ctx = new AudioCtx()
        audioCtxRef.current = ctx

        // Master Gain node
        const masterGain = ctx.createGain()
        masterGain.gain.setValueAtTime(0.0001, ctx.currentTime)
        masterGain.connect(ctx.destination)
        masterGainRef.current = masterGain

        // 1. Procedural Desert Wind (Filtered noise generator)
        const bufferSize = ctx.sampleRate * 2
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
        const output = noiseBuffer.getChannelData(0)
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1
          b0 = 0.99886 * b0 + white * 0.0555179
          b1 = 0.99332 * b1 + white * 0.0750759
          b2 = 0.96900 * b2 + white * 0.1538520
          b3 = 0.86650 * b3 + white * 0.3104856
          b4 = 0.55000 * b4 + white * 0.5329522
          b5 = -0.7616 * b5 - white * 0.0168980
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035
          b6 = white * 0.115926
        }

        const whiteNoise = ctx.createBufferSource()
        whiteNoise.buffer = noiseBuffer
        whiteNoise.loop = true

        // Wind resonant filter (sweeping bandpass)
        const windFilter = ctx.createBiquadFilter()
        windFilter.type = 'bandpass'
        windFilter.frequency.setValueAtTime(240, ctx.currentTime)
        windFilter.Q.setValueAtTime(1.8, ctx.currentTime)

        // Subtle LFO for natural wind swells
        const lfo = ctx.createOscillator()
        lfo.frequency.setValueAtTime(0.12, ctx.currentTime)
        const lfoGain = ctx.createGain()
        lfoGain.gain.setValueAtTime(100, ctx.currentTime)
        lfo.connect(lfoGain)
        lfoGain.connect(windFilter.frequency)
        lfo.start()

        whiteNoise.connect(windFilter)
        windFilter.connect(masterGain)
        whiteNoise.start()

        // 2. Mystical Tomb Drone (Low harmonic resonance)
        const osc1 = ctx.createOscillator()
        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(55, ctx.currentTime) // A1 root

        const osc2 = ctx.createOscillator()
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(110.4, ctx.currentTime) // A2 organic detune

        const droneGain = ctx.createGain()
        droneGain.gain.setValueAtTime(0.3, ctx.currentTime)

        osc1.connect(droneGain)
        osc2.connect(droneGain)
        droneGain.connect(masterGain)
        osc1.start()
        osc2.start()
      }

      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {})
      }

      if (masterGainRef.current && audioCtxRef.current) {
        const now = audioCtxRef.current.currentTime
        masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, now)
        masterGainRef.current.gain.linearRampToValueAtTime(0.065, now + 1.2) // Subtle atmospheric volume
      }
    } catch {
      // AudioContext unavailable or blocked gracefully
    }
  }

  const toggleAudio = () => {
    if (isPlaying) {
      stopAudio()
      setIsPlaying(false)
    } else {
      startAudio()
      setIsPlaying(true)
    }
    setRippling(true)
    setTimeout(() => setRippling(false), 900)
  }

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {})
      }
    }
  }, [])

  return (
    <div className="ancient-ankh-audio-control">
      {/* Expanding Hieroglyphic Ripple Wave */}
      {rippling && (
        <div className="ankh-acoustic-ripple" aria-hidden="true">
          <span className="ripple-glyph">𓋹</span>
          <span className="ripple-glyph">𓁹</span>
          <span className="ripple-glyph">𓆣</span>
        </div>
      )}

      {/* Rusted Bronze Ankh Button */}
      <button
        className={`ankh-toggle-btn ${isPlaying ? 'active' : ''}`}
        onClick={toggleAudio}
        aria-label={isPlaying ? 'Mute Tomb Ambience' : 'Unseal Tomb Atmosphere Audio'}
        title={isPlaying ? 'Mute Atmosphere' : 'Unseal Tomb Atmosphere Audio'}
      >
        <div className="ankh-bronze-crust" />
        <div className="ankh-icon-container">
          <span className="ankh-glyph">𓋹</span>
          <span className="audio-status-icon">
            {isPlaying ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </span>
        </div>
      </button>
    </div>
  )
}
