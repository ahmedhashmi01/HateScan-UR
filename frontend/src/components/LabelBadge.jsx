import { labelMetaFromId } from '../styles/tokens'

export default function LabelBadge({ predicted }) {
  const meta = labelMetaFromId(predicted)

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-border bg-panel px-3 py-1 text-sm"
      style={{ boxShadow: `0 0 0 1px ${meta.color}20 inset` }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
      <span className="font-medium">{meta.name}</span>
    </span>
  )
}

