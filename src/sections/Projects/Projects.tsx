import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { projects, type Project } from '@/data/projects'
import { useReducedMotion, useIsMobile } from '@/lib/useMediaQuery'
import styles from './Projects.module.css'

export function Projects() {
  const container = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const mobile = useIsMobile()
  const flat = reduced || mobile // no stacking transform on mobile / reduced motion
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end'],
  })

  return (
    <section id="work" className={`sheet ${styles.sheetInk}`} aria-labelledby="work-title">
      <span className={`sheet-tab ${styles.tabInk}`}>
        <span className="n">001</span> builds
      </span>

      <div className="container">
        <div className={styles.head}>
          <h2 id="work-title" className={`giant ${styles.title}`}>
            Builds
          </h2>
          <p className={styles.sub}>
            shipped by one marketer and a team of agents — <span>{projects.length} files, open them</span>
          </p>
        </div>

        <div ref={container} className={styles.stack}>
          {projects.map((p, i) => (
            <StackCard
              key={p.id}
              project={p}
              index={i}
              total={projects.length}
              progress={scrollYProgress}
              flat={flat}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function StackCard({
  project,
  index,
  total,
  progress,
  flat,
}: {
  project: Project
  index: number
  total: number
  progress: MotionValue<number>
  flat: boolean
}) {
  // earlier cards shrink as the later ones stack over them
  const targetScale = 1 - (total - 1 - index) * 0.055
  const scale = useTransform(progress, [index / total, 1], [1, targetScale])

  return (
    <div className={styles.slot}>
      <motion.article
        className={styles.card}
        style={{
          marginTop: `${index * 30}px`,
          scale: flat ? 1 : scale,
        }}
      >
        <header className={styles.cardHead}>
          <span className={styles.cardIndex}>{String(index + 1).padStart(2, '0')}</span>
          <div className={styles.cardTitleWrap}>
            <h3 className={styles.cardTitle}>{project.title}</h3>
            <p className={styles.cardKicker}>{project.kicker}</p>
          </div>
          <span className={styles.cardMeta}>
            {project.year} · {project.status.toLowerCase()}
          </span>
        </header>

        <div className={styles.cardBody}>
          <div className={styles.cardText}>
            <p className={styles.cardSummary}>{project.summary}</p>
            <ul className={`tags ${styles.cardTags}`}>
              {project.stack.map((s) => (
                <li key={s} className={`tag ${styles.tagDark}`}>
                  {s}
                </li>
              ))}
            </ul>
            <Link to={`/work/${project.id}`} className={styles.open} data-cursor="Open">
              open file →
            </Link>
          </div>

          <div className={styles.cardMedia}>
            {project.video ? (
              <video poster={project.poster} autoPlay loop muted playsInline>
                <source src={project.video} type="video/mp4" />
              </video>
            ) : project.ascii ? (
              <pre className={styles.ascii}>{project.ascii}</pre>
            ) : project.poster ? (
              <img src={project.poster} alt={`${project.title} preview`} loading="lazy" />
            ) : null}
          </div>
        </div>
      </motion.article>
    </div>
  )
}
