import { Reveal } from '@/components/primitives/Reveal'
import { MagneticButton } from '@/components/layout/MagneticButton'
import { Polaroid } from '@/components/layout/Polaroid'
import { site } from '@/data/site'
import styles from './Contact.module.css'

export function Contact() {
  return (
    <section id="contact" className={`sheet ${styles.sheetPeri}`} aria-labelledby="contact-title">
      <span className={`sheet-tab ${styles.tabPeri}`}>
        <span className="n">004</span> contact
      </span>

      <div className="container">
        <div className={styles.inner}>
          <div className={styles.text}>
            <Reveal>
              <span className={styles.avail}>
                <span className={styles.dot} aria-hidden="true" />
                {site.seeking}
              </span>
              <h2 className={`giant ${styles.title}`} id="contact-title">
                Building an AI company’s GTM? <span className={styles.hl}>Let’s talk.</span>
              </h2>
              <MagneticButton
                className={styles.cta}
                href={`mailto:${site.email}`}
                ariaLabel="Email Daphne"
              >
                Let’s work together ↗
              </MagneticButton>
              <div className={styles.socials}>
                {site.socials.map((s) => (
                  <a key={s.label} href={s.href} className={styles.social}>
                    {s.label.toLowerCase()}
                  </a>
                ))}
              </div>
            </Reveal>
          </div>

          <Polaroid
            className={styles.photo}
            src="/images/character-wave.png"
            alt="Illustrated character of Daphne, leaning in with a smile"
          />
        </div>

        <div className={styles.foot}>
          <span>© 2026 daphne.archive — designed &amp; vibe-coded with Claude Code</span>
          <span className={styles.footRight}>singapore · {site.email}</span>
        </div>
      </div>
    </section>
  )
}
