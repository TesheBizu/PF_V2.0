import { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/api'
import socket from '../lib/socket'

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    socket.connect()

    api
      .get('/settings')
      .then((res) => setSettings(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))

    socket.on('settings:updated', (data) => {
      setSettings(data)
    })

    return () => {
      socket.off('settings:updated')
      socket.disconnect()
    }
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
