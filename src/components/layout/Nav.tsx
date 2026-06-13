import { useLenis } from '@/lib/lenis'
import { site } from '@/data/site'
import { SoundToggle } from './SoundToggle'
import styles from './Nav.module.css'

const links = [
  { label: 'Work', target: '#work' },
  { label: 'Creative', target: '#creative' },
  { label: 'About', target: '#about' },
  { label: 'Contact', target: '#contact' },
]

export function Nav() {
  const { scrollTo } = useLenis()

  const go = (target: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    scrollTo(target, { offset: 0 })
  }

  return (
    <nav className={styles.nav} aria-label="Primary">
      <a className={styles.mark} href="#top" onClick={go('#top')}>
        DK<span className={styles.dot}>.</span>
      </a>
      <div className={styles.links}>
        {links.map((l) => (
          <a
            key={l.target}
            className={`${styles.link} ${l.label === 'Creative' ? styles.hideMobile : ''}`}
            href={l.target}
            onClick={go(l.target)}
          >
            {l.label}
          </a>
        ))}
        <a
          className={`${styles.link} ${styles.hideMobile}`}
          href={site.resume}
          target="_blank"
          rel="noopener noreferrer"
        >
          Résumé
        </a>
        <SoundToggle />
      </div>
    </nav>
  )
}
