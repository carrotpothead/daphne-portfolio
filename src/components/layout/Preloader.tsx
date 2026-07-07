import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'
import { useReducedMotion } from '@/lib/useMediaQuery'
import styles from './Preloader.module.css'

/**
 * One-time intro curtain: counts to 100, reveals the mark, then lifts away.
 * Skipped entirely if already shown this session or under reduced-motion.
 */
export function Preloader({ onDone }: { onDone: () => void }) {
  const seen =
    typeof sessionStorage !== 'undefined' &&
    sessionStorage.getItem('dk-intro') === '1'
  const reduced = useReducedMotion()
  const [count, setCount] = useState(0)
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (seen || reduced) {
        onDone()
        return
      }
      sessionStorage.setItem('dk-intro', '1')

      const counter = { v: 0 }
      const tl = gsap.timeline({
        onComplete: onDone,
        defaults: { ease: 'power3.inOut' },
      })

      tl.to(`.${styles.markInner}`, { yPercent: -110, duration: 0.8, ease: 'power4.out' }, 0.1)
        .to(`.${styles.bar}`, { width: '100%', duration: 1.6, ease: 'power2.inOut' }, 0)
        .to(
          counter,
          {
            v: 100,
            duration: 1.6,
            ease: 'power2.inOut',
            onUpdate: () => setCount(Math.round(counter.v)),
          },
          0,
        )
        .to(`.${styles.markInner}`, { yPercent: -230, duration: 0.6, ease: 'power3.in' }, 1.5)
        .to(root.current, { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, 1.7)
    },
    { scope: root, dependencies: [] },
  )

  if (seen || reduced) return null

  return (
    <div className={styles.preloader} ref={root} aria-hidden="true">
      <span className={styles.mark}>
        <span className={styles.markInner}>
          DK<span className={styles.dot}>.</span>
        </span>
      </span>
      <div className={styles.meta}>
        <span className={styles.label}>indexing daphne.archive</span>
        <span className={styles.counter}>{count}</span>
      </div>
      <div className={styles.bar} />
    </div>
  )
}
