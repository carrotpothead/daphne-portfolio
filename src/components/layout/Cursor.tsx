import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/lib/useMediaQuery'
import styles from './Cursor.module.css'

/**
 * Custom cursor: a lagging ring + a precise dot. Over elements with a
 * [data-cursor] attribute it grows into a labelled disc; over plain links it
 * just scales. Disabled on touch and reduced-motion.
 */
export function Cursor() {
  const reduced = useReducedMotion()
  const ring = useRef<HTMLDivElement>(null)
  const dot = useRef<HTMLDivElement>(null)
  const pos = useRef({ x: -100, y: -100 })
  const target = useRef({ x: -100, y: -100 })
  const [label, setLabel] = useState('')
  const [mode, setMode] = useState<'idle' | 'link' | 'label'>('idle')
  const [touch, setTouch] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) {
      setTouch(true)
      return
    }

    const onMove = (e: PointerEvent) => {
      target.current = { x: e.clientX, y: e.clientY }
      if (dot.current) dot.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
    }

    const onOver = (e: PointerEvent) => {
      const el = (e.target as Element)?.closest('[data-cursor], a, button')
      if (!el) {
        setMode('idle')
        setLabel('')
        return
      }
      const l = el.getAttribute('data-cursor')
      if (l) {
        setLabel(l)
        setMode('label')
      } else {
        setMode('link')
      }
    }

    let raf = 0
    const loop = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.18
      pos.current.y += (target.current.y - pos.current.y) * 0.18
      if (ring.current) {
        ring.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    document.documentElement.classList.add('has-custom-cursor')
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerover', onOver, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      document.documentElement.classList.remove('has-custom-cursor')
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerover', onOver)
    }
  }, [])

  if (touch || reduced) return null

  return (
    <>
      <div ref={dot} className={styles.dot} aria-hidden="true" />
      <div
        ref={ring}
        className={`${styles.ring} ${styles[mode]}`}
        aria-hidden="true"
      >
        <span className={styles.label}>{label}</span>
      </div>
    </>
  )
}
