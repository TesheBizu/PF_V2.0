import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const removeToast = useCallback((id) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = ++toastId
      setToasts((prev) => [...prev, { id, message, type }])
      timers.current[id] = setTimeout(() => removeToast(id), duration)
      return id
    },
    [removeToast],
  )

  const success = useCallback((msg, dur) => showToast(msg, 'success', dur), [showToast])
  const error = useCallback((msg, dur) => showToast(msg, 'error', dur), [showToast])
  const info = useCallback((msg, dur) => showToast(msg, 'info', dur), [showToast])

  return (
    <ToastContext.Provider value={{ toasts, showToast, success, error, info, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
