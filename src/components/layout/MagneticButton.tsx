import { useRef, type ReactNode } from 'react'
import { gsap } from '@/lib/gsap'
import { useReducedMotion } from '@/lib/useMediaQuery'

type Props = {
  children: ReactNode
  href?: string
  onClick?: () => void
  className?: string
  strength?: number
  ariaLabel?: string
  target?: string
}

/** A link/button that eases toward the cursor while hovered (magnetic). */
export function MagneticButton({
  children,
  href,
  onClick,
  className,
  strength = 0.35,
  ariaLabel,
  target,
}: Props) {
  const ref = useRef<HTMLAnchorElement & HTMLButtonElement>(null)
  const reduced = useReducedMotion()

  const onMove = (e: React.MouseEvent) => {
    if (reduced || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const x = (e.clientX - (r.left + r.width / 2)) * strength
    const y = (e.clientY - (r.top + r.height / 2)) * strength
    gsap.to(ref.current, { x, y, duration: 0.4, ease: 'power3.out' })
  }
  const onLeave = () => {
    if (!ref.current) return
    gsap.to(ref.current, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' })
  }

  const common = {
    ref,
    className,
    onMouseMove: onMove,
    onMouseLeave: onLeave,
    'aria-label': ariaLabel,
  }

  if (href) {
    const external = href.startsWith('http')
    return (
      <a
        {...common}
        href={href}
        target={target ?? (external ? '_blank' : undefined)}
        rel={external ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    )
  }
  return (
    <button {...common} type="button" onClick={onClick}>
      {children}
    </button>
  )
}
