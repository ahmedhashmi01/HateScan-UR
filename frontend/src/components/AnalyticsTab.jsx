import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts'
import axios from 'axios'

const EMPTY = {
  total: 0, class_stats: [], recent: [], top_class: 'N/A', top_count: 0
}

function StatCard({ label, value, sub }) {
  return (
    <div style={{
      background: '#141414', border: '0.5px solid rgba(255,255,255,0.10)',
      borderRadius: '12px', padding: '1.25rem', flex: 1, minWidth: '120px'
    }}>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>
        {label}
      </div>
      <div style={{ fontSize: '24px', fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
          {sub}
        </div>
      )}
    </div>
  )
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '10px', padding: '10px 14px', fontSize: '13px'
    }}>
      <div style={{ color: d.color, fontWeight: 500 }}>{d.label}</div>
      <div style={{ color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
        Count: <span style={{ color: '#fff' }}>{d.count}</span>
      </div>
      <div style={{ color: 'rgba(255,255,255,0.6)' }}>
        Share: <span style={{ color: '#fff' }}>{d.percentage}%</span>
      </div>
      <div style={{ color: 'rgba(255,255,255,0.6)' }}>
        Avg confidence: <span style={{ color: '#fff' }}>{d.avg_confidence}%</span>
      </div>
    </div>
  )
}

export default function AnalyticsTab() {
  const [data, setData]       = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)

  const fetch = useCallback(async () => {
    try {
      const res = await axios.get('/api/analytics')
      setData(res.data)
    } catch {
      setData(EMPTY)
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-refresh every 5 seconds
  useEffect(() => {
    fetch()
    const id = setInterval(fetch, 5000)
    return () => clearInterval(id)
  }, [fetch])

  const handleClear = async () => {
    if (!window.confirm('Clear all classification history?')) return
    setClearing(true)
    await axios.post('/api/analytics/clear')
    await fetch()
    setClearing(false)
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.35)' }}>
        Loading analytics...
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      {/* Header */}
      <div style={{
        background: '#141414', border: '0.5px solid rgba(255,255,255,0.10)',
        borderRadius: '16px', padding: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '18px', fontWeight: 500 }}>
              Analytics
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
              Live classification stats — persisted across sessions
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{
              fontSize: '11px', color: 'rgba(255,255,255,0.3)',
              background: 'rgba(29,158,117,0.1)', border: '0.5px solid rgba(29,158,117,0.2)',
              borderRadius: '6px', padding: '4px 10px'
            }}>
              auto-refresh 5s
            </div>
            <button onClick={handleClear} disabled={clearing || data.total === 0}
              style={{
                background: 'rgba(226,75,74,0.1)', border: '0.5px solid rgba(226,75,74,0.3)',
                borderRadius: '8px', padding: '6px 14px', fontSize: '12px',
                color: '#E24B4A', cursor: data.total === 0 ? 'default' : 'pointer',
                opacity: data.total === 0 ? 0.4 : 1
              }}>
              {clearing ? 'Clearing...' : 'Clear history'}
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <StatCard label="total classified" value={data.total.toLocaleString()} />
          <StatCard label="most common class" value={data.top_class}
            sub={`${data.top_count} classifications`} />
          <StatCard label="classes detected"
            value={data.class_stats.length}
            sub={`out of 5 total`} />
          <StatCard label="dataset"
            value="9,212"
            sub="training samples" />
        </div>
      </div>

      {data.total === 0 ? (
        <div style={{
          background: '#141414', border: '0.5px solid rgba(255,255,255,0.10)',
          borderRadius: '16px', padding: '3rem', textAlign: 'center',
          color: 'rgba(255,255,255,0.35)', fontSize: '14px'
        }}>
          No classifications yet — go to the Classify tab and analyse some text.
        </div>
      ) : (
        <>
          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

            {/* Bar chart */}
            <div style={{
              background: '#141414', border: '0.5px solid rgba(255,255,255,0.10)',
              borderRadius: '16px', padding: '1.5rem'
            }}>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem' }}>
                classifications by class
              </div>
              <div style={{ height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.class_stats} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                      axisLine={false} tickLine={false}
                      tickFormatter={l => l.split('/')[0].slice(0,8)} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                      axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {data.class_stats.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie chart */}
            <div style={{
              background: '#141414', border: '0.5px solid rgba(255,255,255,0.10)',
              borderRadius: '16px', padding: '1.5rem'
            }}>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem' }}>
                distribution
              </div>
              <div style={{ height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.class_stats} dataKey="count" nameKey="label"
                      cx="50%" cy="50%" outerRadius={90} innerRadius={50}
                      paddingAngle={3}>
                      {data.class_stats.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                {data.class_stats.map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: s.color, flexShrink: 0 }} />
                    <span style={{ color: 'rgba(255,255,255,0.6)', flex: 1 }}>{s.label}</span>
                    <span style={{ color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Avg confidence per class */}
          <div style={{
            background: '#141414', border: '0.5px solid rgba(255,255,255,0.10)',
            borderRadius: '16px', padding: '1.5rem'
          }}>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem' }}>
              average confidence per class
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.class_stats.map((s, i) => (
                <motion.div key={s.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i }}
                  style={{ display: 'grid', gridTemplateColumns: '180px 1fr 50px', alignItems: 'center', gap: '12px' }}
                >
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{s.label}</div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <motion.div
                      style={{ height: '100%', background: s.color, borderRadius: '3px' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${s.avg_confidence}%` }}
                      transition={{ delay: 0.1 * i + 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <div style={{ fontSize: '12px', color: s.color, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {s.avg_confidence}%
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recent classifications */}
          <div style={{
            background: '#141414', border: '0.5px solid rgba(255,255,255,0.10)',
            borderRadius: '16px', overflow: 'hidden'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                recent classifications
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#0f0f0f' }}>
                    {['text', 'label', 'confidence', 'time'].map(h => (
                      <th key={h} style={{
                        padding: '10px 16px', textAlign: 'left',
                        color: 'rgba(255,255,255,0.35)', fontWeight: 500,
                        fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((r, i) => (
                    <motion.tr key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.04 * i }}
                      style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}
                    >
                      <td style={{ padding: '10px 16px', color: 'rgba(255,255,255,0.7)', maxWidth: '400px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.text}
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{
                          background: `${r.color}18`, border: `0.5px solid ${r.color}40`,
                          color: r.color, borderRadius: '6px',
                          padding: '3px 10px', fontSize: '12px', whiteSpace: 'nowrap'
                        }}>
                          {r.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', color: r.color, fontVariantNumeric: 'tabular-nums' }}>
                        {r.confidence}%
                      </td>
                      <td style={{ padding: '10px 16px', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', fontSize: '12px' }}>
                        {r.timestamp}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
}