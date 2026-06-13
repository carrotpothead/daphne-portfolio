import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'
import { useReducedMotion } from '@/lib/useMediaQuery'
import styles from './Concept.module.css'

const lines = [
  'Most people pick a side —',
  'the ones who imagine,',
  'and the ones who build.',
  'I sit in the seam.',
]

export function Concept() {
  const root = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  useGSAP(
    () => {
      if (reduced || !root.current) return
      const lineEls = root.current.querySelectorAll(`.${styles.line}`)

      // Pin the panel; brighten lines one-by-one as you scroll through it.
      gsap.to(lineEls, {
        color: 'var(--text)',
        stagger: 0.5,
        ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: '+=120%',
          scrub: true,
          pin: true,
        },
      })
    },
    { scope: root, dependencies: [reduced] },
  )

  return (
    <section className={styles.concept} ref={root} aria-label="Approach">
      <div className="container">
        <p className={styles.lines}>
          {lines.map((l, i) => (
            <span
              key={i}
              className={`${styles.line} ${i === lines.length - 1 ? styles.lead : ''}`}
            >
              {l}
            </span>
          ))}
        </p>
      </div>
    </section>
  )
}
