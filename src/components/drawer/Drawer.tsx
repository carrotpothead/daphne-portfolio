import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { DrawerEntry } from '@/data/drawer'
import { useReducedMotion } from '@/lib/useMediaQuery'
import styles from './Drawer.module.css'

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * A card-catalog drawer of tabbed folders. Click a tab and its folder
 * springs open in place. `compact` renders a tighter, front-less variant.
 */
export function Drawer({
  entries,
  frontLabel,
  showHint = false,
  compact = false,
}: {
  entries: DrawerEntry[]
  frontLabel?: string
  showHint?: boolean
  compact?: boolean
}) {
  const [open, setOpen] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)
  const reduced = useReducedMotion()
  const total = entries.length
  const firstFile = entries.find((e) => e.kind === 'file')

  return (
    <div className={`${styles.drawer} ${compact ? styles.compact : ''}`} role="list">
      {entries.map((entry, i) => {
        const t = total > 1 ? i / (total - 1) : 1
        const width = compact ? lerp(86, 100, t) : lerp(76, 100, t)
        const isOpen = entry.kind === 'file' && open === entry.n
        return (
          <Row
            key={entry.kind === 'file' ? entry.n : `div-${entry.letter}`}
            entry={entry}
            width={width}
            z={i + 1}
            isOpen={isOpen}
            hint={
              showHint &&
              !touched &&
              entry.kind === 'file' &&
              firstFile?.kind === 'file' &&
              entry.n === firstFile.n
            }
            reduced={reduced}
            onToggle={() => {
              if (entry.kind !== 'file') return
              setTouched(true)
              setOpen(isOpen ? null : entry.n)
            }}
          />
        )
      })}

      <div className={styles.front}>
        {frontLabel && <span className={styles.frontLabel}>{frontLabel}</span>}
      </div>
    </div>
  )
}

function Row({
  entry,
  width,
  z,
  isOpen,
  hint,
  reduced,
  onToggle,
}: {
  entry: DrawerEntry
  width: number
  z: number
  isOpen: boolean
  hint?: boolean
  reduced: boolean
  onToggle: () => void
}) {
  if (entry.kind === 'divider') {
    return (
      <div className={styles.row} style={{ width: `${width}%`, zIndex: z }} role="presentation">
        <div className={styles.sheetFill} aria-hidden="true" />
        <span
          className={`${styles.tab} ${styles.tabDivider}`}
          style={{ left: entry.side === 'left' ? '2%' : '78%' }}
        >
          {entry.letter}
          <span className={styles.divCount}>{entry.count}</span>
        </span>
      </div>
    )
  }

  const panelId = `file-${entry.n.replace(/\W/g, '')}`
  return (
    <div
      className={`${styles.row} ${isOpen ? styles.rowOpen : ''}`}
      style={{ width: `${width}%`, zIndex: z }}
      role="listitem"
    >
      <div className={styles.sheetFill} aria-hidden="true" />

      <button
        type="button"
        className={`${styles.tab} ${hint && !reduced ? styles.tabHint : ''}`}
        style={{ left: `${entry.tabX * 100}%` }}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className={styles.tabN}>{entry.n}</span>
        <span className={styles.tabLabel}>{entry.label}</span>
      </button>

      <motion.div
        id={panelId}
        className={styles.panelZone}
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={
          reduced
            ? { duration: 0 }
            : { type: 'spring', stiffness: 210, damping: 27, opacity: { duration: 0.25 } }
        }
      >
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <span className={styles.panelTitle}>{entry.title}</span>
            {entry.sub && <span className={styles.panelSub}>{entry.sub}</span>}
          </div>

          {entry.img && (
            <img className={styles.panelImg} src={entry.img} alt={entry.title} loading="lazy" />
          )}
          {entry.ascii && <pre className={styles.panelAscii}>{entry.ascii}</pre>}
          {entry.body && <p className={styles.panelBody}>{entry.body}</p>}

          {(entry.tags || entry.link) && (
            <div className={styles.panelFoot}>
              {entry.tags && (
                <ul className="tags">
                  {entry.tags.map((t) => (
                    <li key={t} className="tag">
                      {t}
                    </li>
                  ))}
                </ul>
              )}
              {entry.link &&
                (entry.link.external ? (
                  <a
                    className={styles.panelLink}
                    href={entry.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {entry.link.label}
                  </a>
                ) : (
                  <Link className={styles.panelLink} to={entry.link.href}>
                    {entry.link.label}
                  </Link>
                ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
