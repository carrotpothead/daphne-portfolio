import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { VibesField } from './VibesField'

/**
 * Lazy-loaded WebGL backdrop for the hero. Pauses its render loop whenever the
 * hero scrolls out of view (IntersectionObserver) to save battery/CPU.
 */
export function HeroCanvas() {
  const wrap = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(true)

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0.01 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={wrap} style={{ position: 'absolute', inset: 0 }}>
      <Canvas
        frameloop={active ? 'always' : 'never'}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 6], fov: 52 }}
        style={{ pointerEvents: 'none' }}
      >
        <VibesField />
      </Canvas>
    </div>
  )
}
