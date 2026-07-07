import { useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { useReducedMotion } from '@/lib/useMediaQuery'

/**
 * Scroll-driven character reveal: each character fades 0.15 → 1 as the
 * paragraph moves through the viewport. Words stay unbreakable.
 */
export function AnimatedChars({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.85', 'end 0.4'],
  })

  if (reduced) {
    return <p className={className}>{text}</p>
  }

  const words = text.split(' ')
  const total = text.length
  let cursor = 0

  return (
    <p ref={ref} className={className} aria-label={text}>
      {words.map((word, wi) => {
        const start = cursor
        cursor += word.length + 1
        return (
          <span key={wi} style={{ display: 'inline-block', whiteSpace: 'pre' }} aria-hidden="true">
            {Array.from(word).map((ch, ci) => (
              <Char
                key={ci}
                ch={ch}
                index={start + ci}
                total={total}
                progress={scrollYProgress}
              />
            ))}
            {wi < words.length - 1 ? ' ' : ''}
          </span>
        )
      })}
    </p>
  )
}

function Char({
  ch,
  index,
  total,
  progress,
}: {
  ch: string
  index: number
  total: number
  progress: MotionValue<number>
}) {
  const start = index / total
  const end = Math.min(1, start + 2 / total)
  const opacity = useTransform(progress, [start, end], [0.15, 1])
  return <motion.span style={{ opacity }}>{ch}</motion.span>
}
