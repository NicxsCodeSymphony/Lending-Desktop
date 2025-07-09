import React, { useState } from 'react'
import Sidebar from '../../components/Layout/Sidebar'
import { useSettings } from '../../contexts/SettingsContext'

interface DashboardLayoutProps {
  children: React.ReactNode
  activeItem?: string
  onMenuItemClick?: (itemId: string) => void
}

export default function DashboardLayout({ children, activeItem = 'dashboard', onMenuItemClick }: DashboardLayoutProps) {
  const { settings } = useSettings()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  const handleMenuItemClick = (itemId: string) => {
    if (onMenuItemClick) {
      onMenuItemClick(itemId)
    }
  }

  const isDark = settings.theme === 'dark'
  
  return (
    <div className={`flex h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar 
        activeItem={activeItem}
        onMenuItemClick={handleMenuItemClick}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />
      
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Settings Indicator Bar */}
        <div className={`px-6 py-2 border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-4">
              <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Language: {settings.general.language === 'en-US' ? 'English' : settings.general.language}
              </span>
              <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Date Format: {settings.general.dateFormat}
              </span>
              <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Time Zone: {settings.general.timeZone}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {settings.notifications.email && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Email ✓
                </span>
              )}
              {settings.security.twoFactorEnabled && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  2FA ✓
                </span>
              )}
            </div>
          </div>
        </div>
        
        <main className={`flex-1 p-6 md:p-8 overflow-auto ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
} 