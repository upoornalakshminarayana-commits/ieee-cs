import { useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, ContactShadows, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

// ── Scroll-driven & Interactive Chest Model ──────────────────────────────
interface ChestModelProps {
  openProgress: number // 0 = fully closed, 1 = fully open
}

function ChestModel({ openProgress }: ChestModelProps) {
  const { scene, animations } = useGLTF('/assets/models/sandy_treasure_chest.glb') as any
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const actionRef = useRef<THREE.AnimationAction | null>(null)
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    if (!scene) return
    scene.traverse((obj: THREE.Object3D) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial
          mat.roughness = 0.4
          mat.metalness = 0.65
          mat.envMapIntensity = 1.5
        }
      }
    })
  }, [scene])

  useEffect(() => {
    if (!animations || animations.length === 0) return
    const mixer = new THREE.AnimationMixer(scene)
    mixerRef.current = mixer
    const action = mixer.clipAction(animations[0])
    action.play()
    action.paused = true
    action.time = 0
    actionRef.current = action
    return () => { mixer.stopAllAction() }
  }, [scene, animations])

  // Bidirectional scroll sync: opens as scroll progresses, closes when scrolling up
  useFrame(() => {
    if (!actionRef.current || !mixerRef.current) return
    const clip = actionRef.current.getClip()
    const targetTime = Math.max(0, Math.min(openProgress * clip.duration, clip.duration))
    actionRef.current.time = targetTime
    mixerRef.current.update(0)
  })

  // Subtle floating idle oscillation
  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()
    groupRef.current.position.y = -0.75 + Math.sin(t * 1.2) * 0.05
    groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.12
  })

  return (
    // Scaled up significantly to 2.85 scale
    <group ref={groupRef} position={[0, -0.75, 0]} scale={2.85}>
      <primitive object={scene} />
    </group>
  )
}

// ── Floating Ancient Gold Dust Particles in 3D ──
function GoldenAuraParticles({ count = 40, openProgress }: { count?: number; openProgress: number }) {
  const pointsRef = useRef<THREE.Points>(null)
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 6
      pos[i * 3 + 1] = Math.random() * 4 - 1
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6
    }
    return pos
  }, [count])

  useFrame(({ clock }) => {
    if (!pointsRef.current) return
    const t = clock.getElapsedTime()
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += 0.008 * (1 + openProgress * 2)
      if (pos[i * 3 + 1] > 3.5) pos[i * 3 + 1] = -1
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true
    pointsRef.current.rotation.y = t * 0.08
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        color="#ffd452"
        transparent
        opacity={Math.max(0.3, openProgress * 0.85)}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ── Scene wrapper with cinematic lighting ─────────────────────────────
interface TreasureSceneProps {
  openProgress: number
}

function TreasureScene({ openProgress }: TreasureSceneProps) {
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(0, 1.1, 4.2)
    camera.lookAt(0, -0.1, 0)
  }, [camera])

  const coreLight = openProgress * 12

  return (
    <>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        maxPolarAngle={Math.PI / 2 + 0.1}
        minPolarAngle={Math.PI / 3}
        rotateSpeed={0.5}
      />

      <ambientLight intensity={0.4} color="#382512" />

      <directionalLight
        position={[2.5, 6, 3.5]}
        intensity={1.8}
        color="#ffeaa0"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      <pointLight position={[-4, 2, 2]} intensity={0.8} color="#c68a12" />
      <pointLight position={[4, 2, 2]} intensity={0.8} color="#c68a12" />

      <pointLight position={[0, 0.4, 0.3]} intensity={coreLight} color="#fff6a8" distance={8} />
      <pointLight position={[0, 1.2, 0.8]} intensity={coreLight * 0.6} color="#f3be3a" distance={10} />

      <GoldenAuraParticles openProgress={openProgress} />

      <ChestModel openProgress={openProgress} />

      <ContactShadows
        position={[0, -1.2, 0]}
        opacity={0.85}
        scale={10}
        blur={2.8}
        far={5}
        color="#040201"
      />
    </>
  )
}

interface TreasureChestProps {
  openProgress: number
}

export default function TreasureChest({ openProgress }: TreasureChestProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ fov: 45, near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent', touchAction: 'pan-y' }}
      aria-label="3D treasure chest opening animation"
      role="img"
    >
      <TreasureScene openProgress={openProgress} />
    </Canvas>
  )
}

// Preload
useGLTF.preload('/assets/models/sandy_treasure_chest.glb')
