import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './gsap'
import { useReducedMotion } from './useMediaQuery'

type LenisCtx = {
  lenis: Lenis | null
  scrollTo: (target: string | number | HTMLElement, opts?: object) => void
  stop: () => void
  start: () => void
}

const Ctx = createContext<LenisCtx>({
  lenis: null,
  scrollTo: () => {},
  stop: () => {},
  start: () => {},
})

export const useLenis = () => useContext(Ctx)

/**
 * Initializes Lenis smooth scroll and binds it to GSAP's ticker + ScrollTrigger
 * through a SINGLE rAF loop. Disabled entirely under reduced-motion (native scroll).
 */
export function LenisProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion()
  const lenisRef = useRef<Lenis | null>(null)
  const [, setReady] = useState(false)

  useEffect(() => {
    if (reduced) return // native scroll, no smoothing

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    })
    lenisRef.current = lenis

    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    setReady(true)

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [reduced])

  const value: LenisCtx = {
    lenis: lenisRef.current,
    scrollTo: (target, opts) => {
      const lenis = lenisRef.current
      if (lenis) lenis.scrollTo(target as never, { offset: 0, ...opts })
      else if (typeof target === 'string') {
        document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' })
      }
    },
    stop: () => lenisRef.current?.stop(),
    start: () => lenisRef.current?.start(),
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
