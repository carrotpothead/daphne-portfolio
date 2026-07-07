import { useEffect, useRef, type ReactNode } from 'react'
import { gsap } from '@/lib/gsap'
import { useReducedMotion } from '@/lib/useMediaQuery'

/**
 * Mouse-following magnetic wrapper: when the pointer comes within `radius`
 * of the element, the child eases toward it (translate / strength).
 */
export function Magnet({
  children,
  className,
  radius = 240,
  strength = 4,
}: {
  children: ReactNode
  className?: string
  radius?: number
  strength?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return
    const el = ref.current
    if (!el) return
    let active = false
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.hypot(dx, dy)
      const within = dist < Math.max(r.width, r.height) / 2 + radius
      if (within) {
        active = true
        gsap.to(el, { x: dx / strength, y: dy / strength, duration: 0.5, ease: 'power3.out' })
      } else if (active) {
        active = false
        gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.45)' })
      }
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [reduced, radius, strength])

  return (
    <div ref={ref} className={className} style={{ willChange: 'transform' }}>
      {children}
    </div>
  )
}
