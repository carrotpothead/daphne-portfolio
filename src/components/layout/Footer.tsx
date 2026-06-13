import { site } from '@/data/site'
import styles from './Footer.module.css'

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.left}>
          <p className={styles.big}>Let’s build.</p>
          <p className={styles.built}>
            Built by <b>orchestrating Claude Code</b> · © 2026 Daphne Kam
          </p>
        </div>
        <div className={styles.socials}>
          {site.socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target={s.href.startsWith('http') ? '_blank' : undefined}
              rel="noopener noreferrer"
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
