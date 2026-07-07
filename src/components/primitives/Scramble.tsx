import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/lib/useMediaQuery'

const GLYPHS = '0123456789$%+KMGWRX#/*'

/**
 * Terminal-style decrypt: characters flicker through random glyphs and lock
 * in left-to-right when scrolled into view. Static under reduced motion.
 */
export function Scramble({ text, duration = 900 }: { text: string; duration?: number }) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const [out, setOut] = useState(reduced ? text : '')
  const played = useRef(false)

  useEffect(() => {
    if (reduced) {
      setOut(text)
      return
    }
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || played.current) return
        played.current = true
        io.disconnect()
        const start = performance.now()
        let raf = 0
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration)
          const locked = Math.floor(t * text.length)
          let s = text.slice(0, locked)
          for (let i = locked; i < text.length; i++) {
            const ch = text[i]
            s += ch === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
          }
          setOut(s)
          if (t < 1) raf = requestAnimationFrame(tick)
          else setOut(text)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduced, text, duration])

  return (
    <span ref={ref} aria-label={text}>
      {out || ' '}
    </span>
  )
}
