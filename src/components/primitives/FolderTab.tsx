import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/lib/useMediaQuery'

/** A numbered folder tab that rises out of its folder when scrolled into view. */
export function FolderTab({ n, label }: { n: string; label: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotion()
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (reduced) {
      setInView(true)
      return
    }
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduced])

  return (
    <span ref={ref} className={`folder-tab ${inView ? 'tab-in' : 'tab-out'}`}>
      <span className="n">{n}</span> {label}
    </span>
  )
}
