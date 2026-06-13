import { useSound } from '@/lib/useSound'
import styles from './SoundToggle.module.css'

export function SoundToggle() {
  const { enabled, toggle } = useSound()
  return (
    <button
      className={styles.toggle}
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? 'Mute interface sound' : 'Enable interface sound'}
      title={enabled ? 'Sound on' : 'Sound off'}
    >
      <span className={`${styles.bars} ${enabled ? styles.on : ''}`}>
        <i /><i /><i /><i />
      </span>
    </button>
  )
}
