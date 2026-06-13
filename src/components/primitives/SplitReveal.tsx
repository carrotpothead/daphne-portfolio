import { useRef, type ElementType } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'
import { splitText, type SplitType } from '@/lib/splitText'
import { useReducedMotion } from '@/lib/useMediaQuery'

type Props = {
  text: string
  as?: ElementType
  className?: string
  type?: SplitType
  /** start the scroll trigger here; omit to play on mount */
  trigger?: boolean
  start?: string
  stagger?: number
  delay?: number
}

/**
 * Splits `text` into masked words/chars and reveals them with a staggered
 * rise. Restores clean text under reduced-motion.
 */
export function SplitReveal({
  text,
  as: Tag = 'span',
  className,
  type = 'words',
  trigger = true,
  start = 'top 85%',
  stagger = 0.06,
  delay = 0,
}: Props) {
  const el = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  useGSAP(
    () => {
      if (!el.current) return
      if (reduced) return // leave clean text as-is

      const split = splitText(el.current, type)
      const items = type === 'chars' ? split.chars : split.words

      gsap.set(items, { yPercent: 115 })
      gsap.to(items, {
        yPercent: 0,
        duration: 1,
        ease: 'power4.out',
        stagger,
        delay,
        scrollTrigger: trigger
          ? { trigger: el.current, start, once: true }
          : undefined,
      })

      return () => split.revert()
    },
    { scope: el, dependencies: [reduced, text] },
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Comp = Tag as any
  return (
    <Comp ref={el} className={className}>
      {text}
    </Comp>
  )
}
