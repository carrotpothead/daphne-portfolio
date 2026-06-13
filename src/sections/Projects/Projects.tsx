import { Reveal } from '@/components/primitives/Reveal'
import { projects } from '@/data/projects'
import { ProjectCard } from './ProjectCard'
import styles from './Projects.module.css'

export function Projects() {
  return (
    <section id="work" className={`section ${styles.projects}`} aria-labelledby="work-title">
      <div className="container">
        <div className={styles.head}>
          <h2 id="work-title" className={styles.title}>
            Things I’ve built
          </h2>
          <p className={styles.note}>
            Products and games shipped by orchestrating AI — concept to deployed.
          </p>
        </div>

        <Reveal className={styles.grid} stagger>
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </Reveal>
      </div>
    </section>
  )
}
