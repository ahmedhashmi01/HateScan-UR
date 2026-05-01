import { motion } from 'framer-motion'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { LABELS } from '../styles/tokens'

const MODEL_ROWS = [
  { model: 'Logistic Regression', f1_macro: 0.654, f1_micro: 0.784 },
  { model: 'LinearSVC', f1_macro: 0.676, f1_micro: 0.795 },
  { model: 'Random Forest', f1_macro: 0.612, f1_micro: 0.761 },
  { model: 'XGBoost (best)', f1_macro: 0.691, f1_micro: 0.809 },
]

const PER_CLASS_F1 = [
  { label: 'Abusive/Offensive', value: 0.71, color: '#E24B4A' },
  { label: 'Normal', value: 0.86, color: '#1D9E75' },
  { label: 'Religious Hate', value: 0.62, color: '#D85A30' },
  { label: 'Sexism', value: 0.66, color: '#7F77DD' },
  { label: 'Profane/Untargeted', value: 0.60, color: '#BA7517' },
]

export default function BenchmarkTab() {
  return (
    <div className="grid gap-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-border bg-panel p-6 shadow-soft"
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="font-heading text-lg text-text">Benchmark</div>
            <div className="mt-1 text-sm text-muted">
              Classical ML baselines vs best model. Macro-F1 is the primary selection metric.
            </div>
          </div>

          <div className="rounded-xl border border-border bg-panel2 px-4 py-3 text-sm text-muted">
            <div className="text-text font-medium">Dataset</div>
            <div className="mt-1 grid grid-cols-3 gap-x-5 gap-y-1 tabular-nums">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-muted">Samples</div>
                <div className="text-text">9,212</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-widest text-muted">Classes</div>
                <div className="text-text">{LABELS.length}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-widest text-muted">CV</div>
                <div className="text-text">3-fold</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-[#0f0f0f] p-4">
            <div className="mb-3 text-sm text-muted">Macro-F1 comparison</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MODEL_ROWS} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="model"
                    tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.10)' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0.45, 0.8]}
                    tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.10)' }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0f0f0f',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'rgba(255,255,255,0.86)',
                      borderRadius: 12,
                    }}
                    labelStyle={{ color: 'rgba(255,255,255,0.72)' }}
                  />
                  <Bar dataKey="f1_macro" fill="#1D9E75" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-[#0f0f0f] p-4">
            <div className="mb-3 text-sm text-muted">Per-class F1 (best model)</div>
            <div className="grid gap-3">
              {PER_CLASS_F1.map((r) => (
                <div key={r.label} className="flex items-center gap-3">
                  <div className="w-44 shrink-0 text-sm text-muted">{r.label}</div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-panel2">
                    <motion.div
                      className="absolute left-0 top-0 h-full rounded-full"
                      style={{ background: r.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round(r.value * 1000) / 10}%` }}
                      transition={{ duration: 0.9 }}
                    />
                  </div>
                  <div className="w-14 text-right text-sm tabular-nums text-muted">
                    {(r.value * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0f0f0f] text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Model</th>
                <th className="px-4 py-3 font-medium">F1-macro</th>
                <th className="px-4 py-3 font-medium">F1-micro</th>
              </tr>
            </thead>
            <tbody>
              {MODEL_ROWS.map((r) => (
                <tr key={r.model} className="border-t border-border">
                  <td className="px-4 py-3 text-text">{r.model}</td>
                  <td className="px-4 py-3 tabular-nums text-muted">{r.f1_macro.toFixed(3)}</td>
                  <td className="px-4 py-3 tabular-nums text-muted">{r.f1_micro.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-xs text-muted">
          Best model: XGBoost, val F1-macro 0.691, test accuracy 79%.
        </div>
      </motion.div>
    </div>
  )
}

