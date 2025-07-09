import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Types for our settings
export interface GeneralSettings {
  language: 'en-US' | 'es' | 'fr' | 'de'
  timeZone: 'UTC-5' | 'UTC-6' | 'UTC-7' | 'UTC-8'
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  sms: boolean
  weeklyReports: boolean
}

export interface SecuritySettings {
  twoFactorEnabled: boolean
  sessionTimeout: number // in minutes
  lastPasswordChange: string
}

export interface AppSettings {
  general: GeneralSettings
  notifications: NotificationSettings
  security: SecuritySettings
  theme: 'light' | 'dark'
  version: string
}

interface SettingsContextType {
  settings: AppSettings
  updateGeneralSettings: (settings: Partial<GeneralSettings>) => void
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => void
  setTheme: (theme: 'light' | 'dark') => void
  formatDate: (date: Date | string) => string
  formatCurrency: (amount: number) => string
  exportData: () => Promise<void>
  createBackup: () => Promise<void>
  runSecurityAudit: () => Promise<void>
  resetSettings: () => void
}

const defaultSettings: AppSettings = {
  general: {
    language: 'en-US',
    timeZone: 'UTC-5',
    dateFormat: 'MM/DD/YYYY'
  },
  notifications: {
    email: true,
    push: true,
    sms: false,
    weeklyReports: true
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeout: 30,
    lastPasswordChange: new Date().toISOString()
  },
  theme: 'light',
  version: '1.0.3'
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

interface SettingsProviderProps {
  children: ReactNode
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('lendingAppSettings')
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsedSettings })
      } catch (error) {
        console.error('Failed to parse saved settings:', error)
      }
    }
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('lendingAppSettings', JSON.stringify(settings))
  }, [settings])

  const updateGeneralSettings = (newSettings: Partial<GeneralSettings>) => {
    setSettings(prev => ({
      ...prev,
      general: { ...prev.general, ...newSettings }
    }))
  }

  const updateNotificationSettings = (newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, ...newSettings }
    }))
  }

  const updateSecuritySettings = (newSettings: Partial<SecuritySettings>) => {
    setSettings(prev => ({
      ...prev,
      security: { ...prev.security, ...newSettings }
    }))
  }

  const setTheme = (theme: 'light' | 'dark') => {
    setSettings(prev => ({ ...prev, theme }))
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const { dateFormat } = settings.general

    switch (dateFormat) {
      case 'MM/DD/YYYY':
        return dateObj.toLocaleDateString('en-US')
      case 'DD/MM/YYYY':
        return dateObj.toLocaleDateString('en-GB')
      case 'YYYY-MM-DD':
        return dateObj.toISOString().split('T')[0]
      default:
        return dateObj.toLocaleDateString()
    }
  }

  const formatCurrency = (amount: number) => {
    // Use language setting for currency formatting
    const locale = settings.general.language === 'en-US' ? 'en-US' : settings.general.language
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'PHP', // Assuming PHP as the base currency
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const exportData = async () => {
    try {
      // This would typically call an API to export all system data
      const data = {
        settings,
        exportDate: new Date().toISOString(),
        version: settings.version
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lending-app-data-${formatDate(new Date())}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export data:', error)
      throw error
    }
  }

  const createBackup = async () => {
    try {
      // This would typically call an API to create a system backup
      const backupData = {
        timestamp: new Date().toISOString(),
        settings,
        version: settings.version,
        type: 'full_backup'
      }
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lending-app-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to create backup:', error)
      throw error
    }
  }

  const runSecurityAudit = async () => {
    // This would typically call an API to run security checks
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log('Security audit completed')
        resolve()
      }, 2000)
    })
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    localStorage.removeItem('lendingAppSettings')
  }

  const value: SettingsContextType = {
    settings,
    updateGeneralSettings,
    updateNotificationSettings,
    updateSecuritySettings,
    setTheme,
    formatDate,
    formatCurrency,
    exportData,
    createBackup,
    runSecurityAudit,
    resetSettings
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
} 