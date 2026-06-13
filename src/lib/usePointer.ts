import { useEffect, useRef } from 'react'

export type PointerState = {
  // normalized -1..1, smoothed
  x: number
  y: number
  // raw target -1..1
  tx: number
  ty: number
}

/**
 * Tracks the pointer as a normalized, smoothed vector in a ref (no re-renders).
 * Read `ref.current.x/y` inside a rAF / useFrame loop. Call `update()` each frame
 * to ease the smoothed value toward the target.
 */
export function usePointer() {
  const ref = useRef<PointerState>({ x: 0, y: 0, tx: 0, ty: 0 })

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      ref.current.tx = (e.clientX / window.innerWidth) * 2 - 1
      ref.current.ty = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    const onLeave = () => {
      ref.current.tx = 0
      ref.current.ty = 0
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerout', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerout', onLeave)
    }
  }, [])

  const update = (lerp = 0.08) => {
    const p = ref.current
    p.x += (p.tx - p.x) * lerp
    p.y += (p.ty - p.y) * lerp
  }

  return { ref, update }
}
