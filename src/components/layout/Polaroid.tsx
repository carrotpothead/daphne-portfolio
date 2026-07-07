export function Polaroid({
  src,
  alt,
  className = '',
}: {
  src: string
  alt: string
  className?: string
}) {
  return (
    <div className={`pl-photo ${className}`}>
      <svg
        className="pl-clip"
        width="34"
        height="60"
        viewBox="0 0 42 74"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M28 66 C16 66 13 58 13 50 L13 20 C13 12 18 7 24 7 C30 7 34 12 34 19 L34 54 C34 59 31 62 27 62 C23 62 21 59 21 55 L21 24"
          stroke="#9b9ea8"
          strokeWidth="3.4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <div className="pl-frame">
        <img src={src} alt={alt} loading="lazy" decoding="async" />
      </div>
    </div>
  )
}
