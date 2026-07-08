/** Emerald "match %" ring used on property cards / recommended highlights. */
export function MatchRing({
  value,
  size = 44,
  className,
}: {
  value: number
  size?: number
  className?: string
}) {
  const r = (size - 6) / 2
  const c = 2 * Math.PI * r
  const off = c * (1 - Math.max(0, Math.min(100, value)) / 100)
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="rgba(0,0,0,.35)" stroke="rgba(255,255,255,.25)" strokeWidth="2.5" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#12A574"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <b
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: Math.round(size * 0.28),
          fontWeight: 700,
        }}
      >
        {value}
      </b>
    </div>
  )
}
