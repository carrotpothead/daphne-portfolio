import { Reveal } from '@/components/primitives/Reveal'
import { MagneticButton } from '@/components/layout/MagneticButton'
import { site } from '@/data/site'
import styles from './Contact.module.css'

export function Contact() {
  return (
    <section id="contact" className={styles.contact} aria-labelledby="contact-title">
      <div className="container">
        <Reveal>
          <span className={styles.avail}>
            <span className={styles.dot} aria-hidden="true" />
            {site.available}
          </span>
          <p className={styles.lead} id="contact-title">
            Have something to build?
          </p>
          <MagneticButton href={`mailto:${site.email}`} className={styles.email} strength={0.2}>
            {site.email.split('@')[0]}
            <wbr />@{site.email.split('@')[1]}
          </MagneticButton>
          <div className={styles.links}>
            {site.socials
              .filter((s) => !s.href.startsWith('mailto'))
              .map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.label} ↗
                </a>
              ))}
            <a href={site.resume} target="_blank" rel="noopener noreferrer">
              Résumé ↗
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
