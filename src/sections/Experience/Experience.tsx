import { Reveal } from '@/components/primitives/Reveal'
import { experience } from '@/data/experience'
import styles from './Experience.module.css'

export function Experience() {
  return (
    <section className={`section ${styles.experience}`} aria-labelledby="exp-title">
      <div className="container">
        <h2 id="exp-title" className={styles.title}>
          Where I’ve worked
        </h2>
        {experience.map((role) => (
          <Reveal key={role.company} className={styles.row}>
            <div>
              <div className={styles.company}>{role.company}</div>
              <div className={styles.period}>{role.period}</div>
              <div className={styles.role}>{role.title}</div>
            </div>
            <ul className={styles.notes}>
              {role.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
