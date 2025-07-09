import React, { createContext, useContext, useState, ReactNode } from 'react'
import Toast, { ToastData, ToastType } from '../components/ui/Toast'

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void
  showSuccess: (title: string, message?: string) => void
  showError: (title: string, message?: string) => void
  showWarning: (title: string, message?: string) => void
  showInfo: (title: string, message?: string) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }

  const showToast = (type: ToastType, title: string, message?: string, duration?: number) => {
    const newToast: ToastData = {
      id: generateId(),
      type,
      title,
      message,
      duration
    }

    setToasts(prev => [...prev, newToast])
  }

  const showSuccess = (title: string, message?: string) => {
    showToast('success', title, message)
  }

  const showError = (title: string, message?: string) => {
    showToast('error', title, message)
  }

  const showWarning = (title: string, message?: string) => {
    showToast('warning', title, message)
  }

  const showInfo = (title: string, message?: string) => {
    showToast('info', title, message)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{
      showToast,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      removeToast
    }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
} 