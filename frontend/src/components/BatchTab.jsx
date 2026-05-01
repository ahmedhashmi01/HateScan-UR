import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { LABELS, labelMetaFromId } from '../styles/tokens'
import LabelBadge from './LabelBadge'

function parseCsvText(csvText) {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length === 0) return []
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const textIdx = header.indexOf('text')
  const start = textIdx >= 0 ? 1 : 0

  const out = []
  for (let i = start; i < lines.length; i += 1) {
    const line = lines[i]
    // Minimal CSV parsing: supports plain rows and quoted fields.
    const m = line.match(/^"([\s\S]*)"$/)
    const raw = m ? m[1] : line
    const parts = raw.split(',') // fallback
    const t = textIdx >= 0 ? parts[textIdx] : raw
    if (t && t.trim()) out.push(t.trim())
  }
  return out
}

function toCsv(rows) {
  const esc = (s) => `"${String(s ?? '').replaceAll('"', '""')}"`
  const header = ['text', 'predicted', 'label', 'confidence']
  const body = rows.map((r) => [
    esc(r.text),
    String(r.predicted),
    esc(r.label),
    esc((r.bestConfidence * 100).toFixed(2)),
  ])
  return [header.join(','), ...body.map((x) => x.join(','))].join('\n')
}

export default function BatchTab() {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')

  const pct = useMemo(() => {
    if (!progress.total) return 0
    return Math.round((progress.done / progress.total) * 100)
  }, [progress])

  async function handleFile(file) {
    setError('')
    setRows([])
    setProgress({ done: 0, total: 0 })

    const text = await file.text()
    const texts = parseCsvText(text).slice(0, 1500) // keep UI responsive
    if (texts.length === 0) {
      setError('No rows detected. Provide a CSV with a `text` column (recommended).')
      return
    }

    setProcessing(true)
    setProgress({ done: 0, total: texts.length })

    const out = []
    for (let i = 0; i < texts.length; i += 1) {
      const t = texts[i]
      try {
        const res = await axios.post('/api/classify', { text: t })
        const predicted = Number(res.data?.predicted ?? 1)
        const conf = Array.isArray(res.data?.confidence) ? res.data.confidence : []
        const best = conf[predicted] ?? Math.max(...conf, 0)
        const meta = labelMetaFromId(predicted)
        out.push({
          text: t,
          predicted,
          label: meta.name,
          bestConfidence: Number(best) || 0,
          confidence: conf,
        })
      } catch {
        out.push({
          text: t,
          predicted: 1,
          label: 'Normal',
          bestConfidence: 0,
          confidence: LABELS.map(() => 0),
        })
      }
      if (i % 5 === 0) {
        setRows([...out])
        setProgress({ done: i + 1, total: texts.length })
      }
    }

    setRows(out)
    setProgress({ done: texts.length, total: texts.length })
    setProcessing(false)
  }

  function download() {
    const csv = toCsv(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'beyond_binary_batch_results.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid gap-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-border bg-panel p-6 shadow-soft"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-heading text-lg text-text">Batch classify CSV</div>
            <div className="mt-1 text-sm text-muted">
              Upload a CSV with a <span className="text-text">text</span> column. Processing runs
              row-by-row against the Flask API.
            </div>
          </div>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-xl border border-border bg-panel2 px-4 py-2 text-sm text-muted transition hover:text-text"
          >
            Choose file
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }}
          />
        </div>

        <div
          onDragEnter={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            const f = e.dataTransfer.files?.[0]
            if (f) handleFile(f)
          }}
          className={[
            'mt-5 rounded-2xl border border-dashed p-8 text-center transition',
            dragOver ? 'border-accent bg-[rgba(29,158,117,0.08)]' : 'border-border bg-[#0f0f0f]',
          ].join(' ')}
        >
          <div className="text-text">Drag & drop a CSV here</div>
          <div className="mt-1 text-sm text-muted">
            Tip: For large files, we cap to 1500 rows for UI responsiveness.
          </div>
        </div>

        {error ? <div className="mt-4 text-sm text-abusive">{error}</div> : null}

        {progress.total ? (
          <div className="mt-5">
            <div className="flex items-center justify-between text-sm text-muted">
              <span>
                {processing ? 'Processing…' : 'Done'} {progress.done}/{progress.total}
              </span>
              <span className="tabular-nums">{pct}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-panel2">
              <motion.div
                className="h-full rounded-full bg-accent"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
          </div>
        ) : null}

        {rows.length ? (
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={download}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-[#04130e] shadow-glow"
            >
              Download results CSV
            </button>
          </div>
        ) : null}
      </motion.div>

      {rows.length ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-border bg-panel p-0 shadow-soft overflow-hidden"
        >
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-[#0f0f0f] text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Text</th>
                  <th className="px-4 py-3 font-medium">Predicted</th>
                  <th className="px-4 py-3 font-medium">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={idx} className="border-t border-border">
                    <td className="px-4 py-3 text-muted max-w-[720px]">
                      <div className="line-clamp-2">{r.text}</div>
                    </td>
                    <td className="px-4 py-3">
                      <LabelBadge predicted={r.predicted} />
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted">
                      {(r.bestConfidence * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : null}
    </div>
  )
}

