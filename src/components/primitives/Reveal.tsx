import { useRef, type ElementType, type ReactNode } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'
import { useReducedMotion } from '@/lib/useMediaQuery'

type Props = {
  children: ReactNode
  as?: ElementType
  className?: string
  /** stagger direct children instead of revealing the block as one */
  stagger?: boolean
  delay?: number
  y?: number
}

/**
 * Fade + translate-up on scroll into view. Reveals immediately (no motion)
 * under prefers-reduced-motion.
 */
export function Reveal({
  children,
  as: Tag = 'div',
  className,
  stagger = false,
  delay = 0,
  y = 28,
}: Props) {
  const el = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  useGSAP(
    () => {
      if (reduced || !el.current) return
      const targets = stagger
        ? (Array.from(el.current.children) as HTMLElement[])
        : [el.current]

      gsap.set(targets, { opacity: 0, y })
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        delay,
        ease: 'power3.out',
        stagger: stagger ? 0.08 : 0,
        scrollTrigger: {
          trigger: el.current,
          start: 'top 85%',
          once: true,
        },
      })
    },
    { scope: el, dependencies: [reduced] },
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Comp = Tag as any
  return (
    <Comp ref={el} className={className}>
      {children}
    </Comp>
  )
}
