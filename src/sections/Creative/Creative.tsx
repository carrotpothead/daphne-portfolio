import { Reveal } from '@/components/primitives/Reveal'
import { creative, creativeProof } from '@/data/creative'
import styles from './Creative.module.css'

export function Creative() {
  return (
    <section id="creative" className={`section ${styles.creative}`} aria-labelledby="creative-title">
      <div className="container">
        <div className={styles.head}>
          <h2 id="creative-title" className={styles.title}>
            Creative & campaigns
          </h2>
          <p className={styles.intro}>
            The other half of the job: AI-generated creative, campaign work, and brand
            visuals — from launches that reached millions.
          </p>
        </div>

        <Reveal className={styles.proof} stagger>
          {creativeProof.map((p) => (
            <div key={p.label} className={styles.proofItem}>
              <div className={styles.proofValue}>{p.value}</div>
              <div className={styles.proofLabel}>{p.label}</div>
            </div>
          ))}
        </Reveal>

        <Reveal className={styles.grid} stagger>
          {creative.map((item) => (
            <figure
              key={item.id}
              className={`${styles.tile} ${styles[item.shape]}`}
            >
              {item.image && (
                <img src={item.image} alt={item.title} loading="lazy" decoding="async" />
              )}
              <figcaption className={styles.tileMeta}>
                <div className={styles.tileTag}>{item.tag}</div>
                <div className={styles.tileTitle}>{item.title}</div>
              </figcaption>
            </figure>
          ))}
        </Reveal>

        <p className={styles.placeholderNote}>
          Visual case studies dropping in soon — campaign stills and Higgsfield sets.
        </p>
      </div>
    </section>
  )
}
