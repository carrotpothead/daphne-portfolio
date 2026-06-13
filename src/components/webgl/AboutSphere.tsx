import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'

function Blob() {
  const mesh = useRef<Mesh>(null)
  useFrame((state, delta) => {
    if (!mesh.current) return
    mesh.current.rotation.y += delta * 0.18
    mesh.current.rotation.x += delta * 0.06
    const t = state.clock.elapsedTime
    const s = 1 + Math.sin(t * 0.8) * 0.03
    mesh.current.scale.set(s, s, s)
  })
  return (
    <mesh ref={mesh}>
      <icosahedronGeometry args={[1.5, 4]} />
      <meshStandardMaterial
        color="#5ee0b0"
        emissive="#1b5e46"
        roughness={0.35}
        metalness={0.4}
        wireframe
      />
    </mesh>
  )
}

/** Decorative wireframe sphere for the About section. Pauses when offscreen. */
export function AboutSphere() {
  const wrap = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), {
      threshold: 0.05,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={wrap} style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
      <Canvas
        frameloop={active ? 'always' : 'never'}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 4.2], fov: 45 }}
        style={{ pointerEvents: 'none' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 3, 3]} intensity={1.2} color="#7aa2ff" />
        <Blob />
      </Canvas>
    </div>
  )
}
