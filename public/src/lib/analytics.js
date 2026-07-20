const SESSION_KEY = 'pf_analytics_session'

function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY)
    if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return crypto.randomUUID()
  }
}

const sessionId = getSessionId()

export function trackEvent(event, meta = {}) {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  fetch(`${url}/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, event, meta }),
    keepalive: true,
  }).catch(() => {})
}
