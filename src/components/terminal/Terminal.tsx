import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projects } from '@/data/projects'
import { campaigns } from '@/data/campaigns'
import { site } from '@/data/site'
import { useReducedMotion } from '@/lib/useMediaQuery'
import styles from './Terminal.module.css'

type Line = { text: string; kind: 'out' | 'cmd' | 'ok' | 'err' }

const BOOT: Line[] = [
  { text: 'daphne.archive — interactive index v2.0', kind: 'out' },
  { text: 'connected. this is a real terminal — try `help`', kind: 'ok' },
]

const HELP = [
  'help            what you’re reading',
  'ls              list the build files',
  'open <file>     open a build (e.g. open misemash)',
  'campaigns       the marketing case files',
  'story           career changelog',
  'whoami          who is daphne',
  'stack           how she builds',
  'contact         reach her',
  'clear           wipe the screen',
  'sudo hire_daphne   …try it',
]

export function Terminal() {
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const [lines, setLines] = useState<Line[]>([])
  const [input, setInput] = useState('')
  const [booted, setBooted] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // boot when scrolled into view
  useEffect(() => {
    const el = rootRef.current
    if (!el || booted) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        setBooted(true)
        if (reduced) {
          setLines(BOOT)
          return
        }
        let i = 0
        const tick = () => {
          setLines(BOOT.slice(0, i + 1))
          i++
          if (i < BOOT.length) setTimeout(tick, 420)
        }
        setTimeout(tick, 300)
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [booted, reduced])

  // keep scrolled to bottom
  useEffect(() => {
    const b = bodyRef.current
    if (b) b.scrollTop = b.scrollHeight
  }, [lines])

  const print = (out: string[], kind: Line['kind'] = 'out') =>
    setLines((prev) => [...prev, ...out.map((text) => ({ text, kind }))])

  const run = (raw: string) => {
    const cmd = raw.trim().toLowerCase()
    setLines((prev) => [...prev, { text: `❯ ${raw}`, kind: 'cmd' }])
    if (!cmd) return

    if (cmd === 'help') return print(HELP)
    if (cmd === 'clear') return setLines([])
    if (cmd === 'ls' || cmd === 'work')
      return print(
        projects.map(
          (p, i) => `${String(i + 1).padStart(3, '0')}  ${p.id.padEnd(16)} ${p.status.toLowerCase()}`,
        ),
      )
    if (cmd.startsWith('open ')) {
      const id = cmd.slice(5).trim()
      const hit = projects.find((p) => p.id === id || p.id.replace(/-/g, '') === id.replace(/[-_ ]/g, ''))
      if (hit) {
        print([`opening ${hit.id}…`], 'ok')
        setTimeout(() => navigate(`/work/${hit.id}`), 450)
        return
      }
      return print([`file not found: ${id} — try \`ls\``], 'err')
    }
    if (cmd === 'whoami')
      return print([
        'daphne — ai-native creative technologist, singapore.',
        'marketer by trade, builder by ai. ships games, apps and campaigns.',
      ])
    if (cmd === 'stack')
      return print(site.stack.map((s) => `${s.title.padEnd(26)} ${s.tag}`))
    if (cmd === 'campaigns')
      return print(
        campaigns.map((c) => {
          let o = c.outcome.split(';')[0].toLowerCase()
          if (o.length > 48) o = o.slice(0, o.lastIndexOf(' ', 48)) + '…'
          return `${c.n}  ${c.id.padEnd(30)} ${o}`
        }),
      )
    if (cmd === 'story' || cmd === 'record')
      return print(site.story.map((s) => `${s.v}  ${s.name.padEnd(16)} ${s.line.toLowerCase()}`))
    if (cmd === 'contact')
      return print([`email: ${site.email}`, 'github: carrotpothead · x: @flippingcucken'], 'ok')
    if (cmd === 'sudo hire_daphne' || cmd === 'hire_daphne' || cmd === 'sudo hire daphne') {
      print(['permission granted ✓', `drafting offer letter… just kidding. email: ${site.email}`], 'ok')
      return
    }
    return print([`command not found: ${cmd} — try \`help\``], 'err')
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    run(input)
    setInput('')
  }

  return (
    <div
      ref={rootRef}
      className={styles.terminal}
      onClick={() => inputRef.current?.focus()}
      data-lenis-prevent
    >
      <div className={styles.bar}>
        <span className={styles.dotR} />
        <span className={styles.dotY} />
        <span className={styles.dotG} />
        <span className={styles.title}>daphne@archive ~ zsh</span>
      </div>
      <div className={styles.body} ref={bodyRef}>
        {lines.map((l, i) => (
          <div key={i} className={`${styles.line} ${styles[l.kind]}`}>
            {l.text}
          </div>
        ))}
        {booted && (
          <form className={styles.inputRow} onSubmit={onSubmit}>
            <span className={styles.prompt}>❯</span>
            <input
              ref={inputRef}
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              aria-label="Terminal input — type help to explore"
              placeholder="type `help`"
            />
          </form>
        )}
      </div>
    </div>
  )
}
