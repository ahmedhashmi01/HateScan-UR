import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'

import StatusIndicator from './components/StatusIndicator'
import TabButton from './components/TabButton'
import ClassifyTab from './components/ClassifyTab'
import BatchTab from './components/BatchTab'
import BenchmarkTab from './components/BenchmarkTab'
import AboutTab from './components/AboutTab'
import AnalyticsTab from './components/AnalyticsTab'
const TABS = [
  { id: 'classify', label: 'Classify' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'batch', label: 'Batch' },
  { id: 'benchmark', label: 'Benchmark' },
  { id: 'about', label: 'About' },
]

export default function App() {
  const [tab, setTab] = useState('classify')

  const content = useMemo(() => {
    if (tab === 'batch') return <BatchTab />
    if (tab === 'analytics')  return <AnalyticsTab />
    if (tab === 'benchmark') return <BenchmarkTab />
    if (tab === 'about') return <AboutTab />
    return <ClassifyTab />
  }, [tab])

  return (
    <div className="min-h-screen bg-bg bb-grid bb-noise">
      <div className="mx-auto w-full max-w-6xl px-5 py-10">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center text-center gap-3">
  <div>
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="bb-title">Beyond Binary</span>
    </motion.div>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="mt-1 text-sm text-muted"
    >
      Fine-Grained Cyberbullying Detection in Roman Urdu · ITU Pakistan
    </motion.div>
  </div>
  <StatusIndicator />
</div>

          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-panel p-2 shadow-soft">
            {TABS.map((t) => (
              <TabButton key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
                {t.label}
              </TabButton>
            ))}
            <div className="ml-auto hidden items-center gap-2 pr-2 text-xs text-muted md:flex">
              <span className="tabular-nums">XGBoost</span>
              <span className="text-[rgba(255,255,255,0.20)]">·</span>
              <span className="tabular-nums">F1-macro 0.691</span>
              <span className="text-[rgba(255,255,255,0.20)]">·</span>
              <span className="tabular-nums">79% test acc</span>
            </div>
          </div>

          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            {content}
          </motion.div>

          <div className="pt-2 text-xs text-muted">
            API: <span className="text-text">/api/classify</span> via Vite proxy to Flask on{' '}
            <span className="text-text">localhost:5000</span>.
          </div>
        </div>
      </div>
    </div>
  )
}
