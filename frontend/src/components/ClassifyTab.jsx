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
  const [text, setText]       = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [explain, setExplain] = useState(null)
  const [error, setError]     = useState('')

  const canSubmit = text.trim().length > 0 && !loading

  async function onClassify() {
    setError(''); setLoading(true); setResult(null); setExplain(null)
    try {
      // Step 1: classify
      const res = await axios.post('/api/classify', { text })
      setResult(res.data)

      // Step 2: explain (runs right after)
      const expRes = await axios.post('/api/explain', {
        text,
        predicted: res.data.predicted
      })
      setExplain(expRes.data)
    } catch (e) {
      setError('Could not reach the API. Ensure Flask is running on localhost:5000.')
    } finally {
      setLoading(false)
    }
  }

  const bars = useMemo(() => {
    const conf = Array.isArray(result?.confidence) ? result.confidence : null
    return LABELS.map((l, idx) => ({ ...l, value: conf ? conf[idx] : 0 }))
  }, [result])

  // Normalize SHAP values to 0-100% for bar width
  const maxShap = useMemo(() => {
    if (!explain?.top_words?.length) return 1
    return Math.max(...explain.top_words.map(w => Math.abs(w.shap)), 0.001)
  }, [explain])

  return (
    <div className="grid gap-6">
      {/* Input card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-border bg-panel p-6 shadow-soft"
      >
        <div className="font-heading text-lg text-text">Classify a Roman Urdu post</div>
        <div className="mt-1 text-sm text-muted">
          Fine-grained cyberbullying detection (5 classes). Emojis & code-switching supported.
        </div>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder='Yahan Roman Urdu text likhein… (e.g., "ye banda bohat rude hai")'
          className="mt-4 min-h-[160px] w-full resize-y rounded-xl border border-border bg-panel2 p-4 text-base text-text outline-none placeholder:text-muted"
          style={{ fontFamily: 'var(--font-sans)' }}
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map(ex => (
              <button key={ex} type="button" onClick={() => setText(ex)}
                className="rounded-full border border-border bg-panel2 px-3 py-1 text-sm text-muted transition hover:text-text">
                {ex}
              </button>
            ))}
          </div>
          <button type="button" disabled={!canSubmit} onClick={onClassify}
            className="rounded-xl bg-accent px-5 py-3 text-sm font-medium shadow-glow transition disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ color: '#04130e' }}>
            {loading ? 'Classifying…' : 'Classify'}
          </button>
        </div>

        {error && <div className="mt-3 text-sm text-abusive">{error}</div>}
      </motion.div>

      {/* Results card */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="rounded-2xl border border-border bg-panel p-6 shadow-soft"
          >
            {/* Predicted label + confidence */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <LabelBadge predicted={result.predicted} />
                <div className="text-sm text-muted">
                  Confidence:{' '}
                  <span className="tabular-nums text-text">
                    {((result.confidence?.[result.predicted] ?? 0) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted">Model: XGBoost · F1-macro 0.691</div>
            </div>

            {/* Confidence bars for all 5 classes */}
            <div className="mt-5 grid gap-3">
              {bars.map(b => (
                <ConfidenceBar key={b.id} label={b.name} value={b.value} color={b.color} />
              ))}
            </div>

            {/* SHAP Explanation panel */}
            {explain?.top_words?.length > 0 && (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2, duration: 0.5 }}
    style={{ marginTop: '1.5rem' }}
  >
    {/* Header */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      marginBottom: '1rem', paddingBottom: '0.75rem',
      borderBottom: '0.5px solid rgba(255,255,255,0.08)'
    }}>
      <div style={{
        background: 'rgba(29,158,117,0.15)',
        border: '0.5px solid rgba(29,158,117,0.3)',
        borderRadius: '6px', padding: '4px 10px',
        fontSize: '11px', fontWeight: 500,
        color: '#1D9E75', letterSpacing: '0.05em'
      }}>SHAP</div>
      <div style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
        Why this prediction?
      </div>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginLeft: '2px' }}>
        top contributing words
      </div>
    </div>

    {/* Word chips — pushing toward */}
    <div style={{ marginBottom: '1rem' }}>
      <div style={{
        fontSize: '11px', color: 'rgba(255,255,255,0.35)',
        letterSpacing: '0.08em', textTransform: 'uppercase',
        marginBottom: '10px'
      }}>
        pushing toward "{explain.label}"
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {explain.top_words.map((w, i) => {
          const pct = Math.min((w.shap / explain.top_words[0].shap) * 100, 100)
          const labelColor = LABELS[result.predicted]?.color ?? '#1D9E75'
          return (
            <motion.div
              key={w.word}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.4 }}
              style={{
                display: 'grid',
                gridTemplateColumns: '100px 1fr 60px',
                alignItems: 'center', gap: '12px'
              }}
            >
              {/* Word badge */}
              <div style={{
                background: `${labelColor}18`,
                border: `0.5px solid ${labelColor}40`,
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '13px',
                fontWeight: 500,
                color: labelColor,
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {w.word}
              </div>

              {/* Bar */}
              <div style={{
                height: '6px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <motion.div
                  style={{
                    height: '100%',
                    background: `linear-gradient(90deg, ${labelColor}cc, ${labelColor})`,
                    borderRadius: '3px'
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.08 * i + 0.15, duration: 0.7, ease: [0.22,1,0.36,1] }}
                />
              </div>

              {/* Score */}
              <div style={{
                fontSize: '12px',
                fontVariantNumeric: 'tabular-nums',
                color: labelColor,
                fontWeight: 500,
                textAlign: 'right'
              }}>
                +{w.shap.toFixed(3)}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>

          {/* Contrast words — pushing away */}
          {explain.contrast_words?.length > 0 && (
            <div style={{
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '0.5px solid rgba(255,255,255,0.06)'
            }}>
              <div style={{
                fontSize: '11px', color: 'rgba(255,255,255,0.35)',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                marginBottom: '10px'
              }}>
                pushing away from "{explain.label}"
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {explain.contrast_words.map((w, i) => {
                  const maxNeg = Math.abs(explain.contrast_words[0].shap)
                  const pct = Math.min((Math.abs(w.shap) / maxNeg) * 100, 100)
                  return (
                    <motion.div
                      key={w.word}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 * i + 0.3, duration: 0.4 }}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '100px 1fr 60px',
                        alignItems: 'center', gap: '12px'
                      }}
                    >
                      <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '0.5px solid rgba(255,255,255,0.10)',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '13px',
                        color: 'rgba(255,255,255,0.45)',
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {w.word}
                      </div>

                      <div style={{
                        height: '6px',
                        background: 'rgba(255,255,255,0.06)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <motion.div
                          style={{
                            height: '100%',
                            background: 'rgba(255,255,255,0.20)',
                            borderRadius: '3px'
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.08 * i + 0.45, duration: 0.7 }}
                        />
                      </div>

                      <div style={{
                        fontSize: '12px',
                        fontVariantNumeric: 'tabular-nums',
                        color: 'rgba(255,255,255,0.35)',
                        textAlign: 'right'
                      }}>
                        {w.shap.toFixed(3)}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Footer note */}
          <div style={{
            marginTop: '1rem',
            paddingTop: '0.75rem',
            borderTop: '0.5px solid rgba(255,255,255,0.06)',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.25)',
            lineHeight: 1.6
          }}>
            SHAP (SHapley Additive exPlanations) — each word's contribution to the predicted class.
            Higher score = stronger push toward that label.
          </div>
        </motion.div>
      )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}