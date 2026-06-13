import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

type SoundCtx = { enabled: boolean; toggle: () => void; blip: (freq?: number) => void }
const Ctx = createContext<SoundCtx>({ enabled: false, toggle: () => {}, blip: () => {} })
export const useSound = () => useContext(Ctx)

/**
 * Synthesized UI sound — no audio files. When enabled, plays a soft blip on
 * hover/click of links & buttons (event-delegated). Preference persists.
 */
export function SoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false)
  const ac = useRef<AudioContext | null>(null)
  const lastHover = useRef(0)

  useEffect(() => {
    setEnabled(localStorage.getItem('dk-sound') === '1')
  }, [])

  const ctxFor = () => {
    if (!ac.current) {
      const AC = window.AudioContext || (window as never as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ac.current = new AC()
    }
    return ac.current
  }

  const play = (freq: number, gain: number, dur: number) => {
    const ctx = ctxFor()
    if (ctx.state === 'suspended') ctx.resume()
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    g.gain.setValueAtTime(0, ctx.currentTime)
    g.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur)
    osc.connect(g).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + dur)
  }

  const blip = (freq = 660) => {
    if (!enabled) return
    play(freq, 0.04, 0.12)
  }

  const toggle = () => {
    setEnabled((e) => {
      const next = !e
      localStorage.setItem('dk-sound', next ? '1' : '0')
      if (next) play(880, 0.05, 0.14) // confirmation chirp
      return next
    })
  }

  // Event-delegated hover/click sounds on interactive elements.
  useEffect(() => {
    if (!enabled) return
    const isInteractive = (t: EventTarget | null) =>
      t instanceof Element && t.closest('a, button')

    const onOver = (e: PointerEvent) => {
      if (!isInteractive(e.target)) return
      const now = performance.now()
      if (now - lastHover.current < 80) return
      lastHover.current = now
      play(560, 0.025, 0.09)
    }
    const onClick = (e: MouseEvent) => {
      if (isInteractive(e.target)) play(720, 0.04, 0.12)
    }
    document.addEventListener('pointerover', onOver)
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('click', onClick)
    }
  }, [enabled])

  return <Ctx.Provider value={{ enabled, toggle, blip }}>{children}</Ctx.Provider>
}
