import { motion } from 'framer-motion'

export default function ConfidenceBar({ label, value, color }) {
  const pct = Math.max(0, Math.min(1, Number(value ?? 0)))

  return (
    <div className="flex items-center gap-3">
      <div className="w-44 shrink-0 text-sm text-muted">{label}</div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-panel2">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0, opacity: 0.7 }}
          animate={{ width: `${Math.round(pct * 1000) / 10}%`, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <div className="w-14 text-right text-sm tabular-nums text-muted">
        {(pct * 100).toFixed(1)}%
      </div>
    </div>
  )
}

