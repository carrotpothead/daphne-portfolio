import { useEffect, useState } from 'react'
import { useLenis } from '@/lib/lenis'
import { SoundToggle } from './SoundToggle'
import styles from './Nav.module.css'

const links = [
  { n: '001', label: 'builds', target: '#work' },
  { n: '002', label: 'stack', target: '#stack' },
  { n: '003', label: 'about', target: '#about' },
  { n: '004', label: 'contact', target: '#contact' },
]

export function Nav() {
  const { scrollTo } = useLenis()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const go = (target: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    scrollTo(target, { offset: 0 })
  }

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`} aria-label="Primary">
      <a className={styles.brand} href="#top" onClick={go('#top')}>
        daphne<span className={styles.ext}>.archive</span>
      </a>
      <div className={styles.links}>
        {links.map((l) => (
          <a key={l.target} className={styles.link} href={l.target} onClick={go(l.target)}>
            <span className={styles.n}>{l.n}</span>
            <span className={styles.label}>{l.label}</span>
          </a>
        ))}
        <SoundToggle />
      </div>
    </nav>
  )
}
