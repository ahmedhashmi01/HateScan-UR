import { useMemo, useState } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'

import LabelBadge from './LabelBadge'
import ConfidenceBar from './ConfidenceBar'
import { LABELS } from '../styles/tokens'

const EXAMPLES = [
  'bhai ye banda bilkul bakwas kar raha hai',
  'mashaallah bohat acha kaam hai, shukriya',
  'ye log deen ko badnaam kar rahe hain',
  'aurat ko itna neecha mat dikhao',
  'bc yeh kya scene hai, dimagh kharab',
]

export default function ClassifyTab() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const canSubmit = text.trim().length > 0 && !loading

  async function onClassify() {
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const res = await axios.post('/api/classify', { text })
      setResult(res.data)
    } catch (e) {
      setError('Could not reach the API. Ensure Flask is running on localhost:5000.')
    } finally {
      setLoading(false)
    }
  }

  const bars = useMemo(() => {
    const conf = Array.isArray(result?.confidence) ? result.confidence : null
    return LABELS.map((l, idx) => ({
      ...l,
      value: conf ? conf[idx] : 0,
    }))
  }, [result])

  return (
    <div className="grid gap-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-border bg-panel p-6 shadow-soft"
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="font-heading text-lg text-text">Classify a Roman Urdu post</div>
              <div className="mt-1 text-sm text-muted">
                Fine-grained cyberbullying detection (5 classes). Emojis & code-switching supported.
              </div>
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Yahan Roman Urdu text likhein… (e.g., “ye banda bohat rude hai”)"
            className="min-h-[160px] w-full resize-y rounded-xl border border-border bg-[#0f0f0f] p-4 text-base text-text outline-none ring-0 placeholder:text-[rgba(255,255,255,0.38)] focus:border-[rgba(29,158,117,0.55)] focus:shadow-glow"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setText(ex)}
                  className="rounded-full border border-border bg-panel2 px-3 py-1.5 text-sm text-muted transition hover:text-text"
                >
                  {ex}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={!canSubmit}
              onClick={onClassify}
              className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-3 font-medium text-[#04130e] shadow-glow transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Classifying…' : 'Classify'}
            </button>
          </div>

          {error ? <div className="text-sm text-abusive">{error}</div> : null}
        </div>
      </motion.div>

      <AnimatePresence>
        {result ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.45 }}
            className="rounded-2xl border border-border bg-panel p-6 shadow-soft"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <LabelBadge predicted={result.predicted} />
                <div className="text-sm text-muted">
                  Confidence:{' '}
                  <span className="tabular-nums text-text">
                    {(() => {
                      const conf = Array.isArray(result.confidence) ? result.confidence : []
                      const best = conf?.[Number(result.predicted)] ?? Math.max(...conf, 0)
                      return `${(Number(best) * 100).toFixed(1)}%`
                    })()}
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted">Model: XGBoost (F1-macro 0.691)</div>
            </div>

            <div className="mt-5 grid gap-3">
              {bars.map((b) => (
                <ConfidenceBar
                  key={b.id}
                  label={b.name}
                  value={b.value}
                  color={b.color}
                />
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

