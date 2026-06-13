import { Reveal } from '@/components/primitives/Reveal'
import { SplitReveal } from '@/components/primitives/SplitReveal'
import { site } from '@/data/site'
import styles from './Services.module.css'

export function Services() {
  return (
    <section className={`section ${styles.services}`} aria-labelledby="services-title">
      <div className="container">
        <div className={styles.head}>
          <h2 id="services-title" className={styles.tagline}>
            <SplitReveal text="What I do, end to end." type="words" />
          </h2>
          <p className="eyebrow">Capabilities</p>
        </div>

        <Reveal as="ul" className={styles.list} stagger>
          {site.capabilities.map((cap, i) => (
            <li key={cap} className={styles.item}>
              <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
              <span className={styles.label}>{cap}</span>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
