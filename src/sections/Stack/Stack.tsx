import { Reveal } from '@/components/primitives/Reveal'
import { Terminal } from '@/components/terminal/Terminal'
import { site } from '@/data/site'
import styles from './Stack.module.css'

export function Stack() {
  return (
    <section id="stack" className={`sheet ${styles.sheetWhite}`} aria-labelledby="stack-title">
      <span className={`sheet-tab ${styles.tabWhite}`}>
        <span className="n">002</span> stack
      </span>

      <div className="container">
        <div className={styles.grid}>
          <div className={styles.intro}>
            <Reveal>
              <h2 id="stack-title" className={styles.title}>
                {site.stackLead}
              </h2>
              <p className={styles.sub}>{site.stackSub}</p>

              <div className={styles.cards}>
                {site.stack.map((s) => (
                  <div key={s.id} className={styles.card}>
                    <div className={styles.cardHead}>
                      <span className={styles.cardTitle}>{s.title}</span>
                      <span className="tag">{s.tag}</span>
                    </div>
                    <p className={styles.cardDesc}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <div className={styles.termCol}>
            <Reveal delay={0.15}>
              <p className={styles.termHint}>
                <span className={styles.hintDot} aria-hidden="true" />
                don’t take my word for it — this one’s live
              </p>
              <Terminal />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
