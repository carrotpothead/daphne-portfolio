import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { projects } from '@/data/projects'
import { useLenis } from '@/lib/lenis'
import styles from './ProjectDetail.module.css'

export function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { stop, start } = useLenis()
  const closeRef = useRef<HTMLButtonElement>(null)
  const [playing, setPlaying] = useState(false)

  const index = projects.findIndex((p) => p.id === id)
  const project = projects[index]
  const next = projects[(index + 1) % projects.length]

  const close = () => navigate('/')

  // Lock page scroll behind the overlay; restore on unmount.
  useEffect(() => {
    stop()
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      start()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (!project) {
    return (
      <div className={styles.overlay}>
        <div className="container" style={{ paddingTop: '30vh' }}>
          <p>Project not found.</p>
          <Link to="/" className={styles.liveLink}>
            ← Back
          </Link>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={`${project.title} — project detail`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={styles.nav}>
        <span className={styles.navTitle}>{project.title}</span>
        <button ref={closeRef} className={styles.close} onClick={close}>
          Close ✕
        </button>
      </div>

      <motion.div
        className="container"
        initial={{ y: 28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
      >
        <div className={styles.hero}>
          <p className={styles.kicker}>{project.kicker}</p>
          <h1 className={styles.title}>{project.title}</h1>
          <p className={styles.summary}>{project.summary}</p>
          <p className={styles.role}>
            <b>My role:</b> {project.role}
          </p>
        </div>

        {project.metrics && (
          <div className={styles.metrics}>
            {project.metrics.map((m) => (
              <div key={m.label} className={styles.metric}>
                <div className={styles.mv}>{m.value}</div>
                <div className={styles.ml}>{m.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Playable / preview embed (click-to-load) */}
        {(project.embedUrl || project.poster) && (
          <div className={styles.embed}>
            <div className={styles.embedShell}>
              {playing && project.embedUrl ? (
                <iframe
                  src={project.embedUrl}
                  title={`${project.title} — playable`}
                  loading="lazy"
                  allow="fullscreen; autoplay"
                />
              ) : (
                <>
                  <img
                    className={styles.poster}
                    src={project.poster}
                    alt={`${project.title} preview`}
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.opacity = '0'
                    }}
                  />
                  {project.embedUrl && (
                    <button
                      className={styles.playBtn}
                      onClick={() => setPlaying(true)}
                      aria-label={`Play ${project.title}`}
                    >
                      <span className={styles.playLabel}>▶ Play it here</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <div className={styles.detailBody}>
          {project.detail.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        <div className={styles.foot}>
          <div>
            <p style={{ color: 'var(--muted-dim)', fontSize: '0.85rem' }}>Next</p>
            <Link to={`/work/${next.id}`} className={styles.nextLink}>
              {next.title} →
            </Link>
          </div>
          {project.liveUrl && (
            <a
              className={styles.liveLink}
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open live ↗
            </a>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
