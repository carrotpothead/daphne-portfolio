import { useEffect, useRef } from 'react'
import { useReducedMotion } from '@/lib/useMediaQuery'
import styles from './ScrollProgress.module.css'

/** A slim tactile progress rail on the right edge, reflecting scroll position. */
export function ScrollProgress() {
  const thumb = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        const p = max > 0 ? window.scrollY / max : 0
        if (thumb.current) {
          thumb.current.style.transform = `scaleY(${Math.max(0.04, p)})`
        }
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  if (reduced) return null

  return (
    <div className={styles.rail} aria-hidden="true">
      <div ref={thumb} className={styles.thumb} />
    </div>
  )
}
