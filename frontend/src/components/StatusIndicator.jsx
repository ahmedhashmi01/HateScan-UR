import { useEffect, useState } from 'react'
import axios from 'axios'

export default function StatusIndicator() {
  const [ok, setOk] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function ping() {
      try {
        const res = await axios.get('/api/health', { timeout: 1200 })
        if (!cancelled) setOk(res?.data?.status === 'ok')
      } catch {
        if (!cancelled) setOk(false)
      }
    }

    ping()
    const id = setInterval(ping, 3000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  const color = ok === true ? '#1D9E75' : ok === false ? '#E24B4A' : 'rgba(255,255,255,0.35)'
  const label = ok === true ? 'Flask connected' : ok === false ? 'Flask offline' : 'Checking API…'

  return (
    <div className="inline-flex items-center gap-2 text-sm text-muted">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span>{label}</span>
    </div>
  )
}

