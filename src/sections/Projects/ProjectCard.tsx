import { Link } from 'react-router-dom'
import type { Project } from '@/data/projects'
import styles from './Projects.module.css'

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      to={`/work/${project.id}`}
      className={styles.card}
      aria-label={`${project.title} — view project`}
    >
      <div className={styles.media}>
        <span className={styles.statusPill}>{project.status}</span>
        <img
          src={project.poster}
          alt={`${project.title} preview`}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.opacity = '0'
          }}
        />
        <span className={styles.view}>
          <span className={styles.viewInner}>View project</span>
        </span>
      </div>

      <div className={styles.body}>
        <div className={styles.cardTop}>
          <h3 className={styles.cardTitle}>{project.title}</h3>
          <span className={styles.year}>{project.year}</span>
        </div>
        <p className={styles.kicker}>{project.kicker}</p>
        <p className={styles.summary}>{project.summary}</p>
        <div className={styles.stack}>
          {project.stack.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
      </div>
    </Link>
  )
}
