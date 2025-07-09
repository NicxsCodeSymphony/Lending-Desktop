import React, { useState, useEffect } from 'react'
import { 
  Home, 
  Users, 
  DollarSign, 
  Clock, 
  Settings, 
  RefreshCw, 
  ChevronDown,
  Menu,
  X,
  LogOut
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

interface MenuItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
}

interface MenuSection {
  title?: string
  items: MenuItem[]
}

interface SidebarProps {
  activeItem: string
  onMenuItemClick: (itemId: string) => void
  isSidebarOpen: boolean
  onToggleSidebar: () => void
}

export default function Sidebar({ 
  activeItem, 
  onMenuItemClick, 
  isSidebarOpen, 
  onToggleSidebar 
}: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)

  // Debug: Log dropdown state changes
  useEffect(() => {
    console.log('Dropdown state changed:', isUserDropdownOpen)
  }, [isUserDropdownOpen])

  const mainMenuSections: MenuSection[] = [
    {
      title: 'MAIN',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/dashboard' },
        { id: 'customers', label: 'Customers', icon: Users, href: '/dashboard/customers' },
        { id: 'lending', label: 'Lending', icon: DollarSign, href: '/dashboard/lending' },
        { id: 'history', label: 'History', icon: Clock, href: '/dashboard/history' },
      ]
    },
    {
      title: 'SETTINGS',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings, href: '/dashboard/settings' },
        { id: 'sync', label: 'Sync Data', icon: RefreshCw, href: '/dashboard/sync' },
      ]
    }
  ]



  const toggleUserDropdown = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent event bubbling
    console.log('Toggle dropdown:', !isUserDropdownOpen) // Debug log
    setIsUserDropdownOpen(!isUserDropdownOpen)
  }

  const handleMenuItemClick = (itemId: string) => {
    onMenuItemClick(itemId)
    // Close sidebar on mobile after selection
    if (window.innerWidth < 768) {
      onToggleSidebar()
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsUserDropdownOpen(false)
  }

  const getUserInitials = () => {
    if (user && user.account_name) {
      // Use first letter of account_name and username
      const accountInitial = user.account_name.charAt(0)
      const usernameInitial = user.username.charAt(0)
      return `${accountInitial}${usernameInitial}`.toUpperCase()
    }
    return 'LA'
  }



  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      // Don't close if clicking on the dropdown or profile button
      if (target?.closest('.user-dropdown-container')) {
        return
      }
      
      if (isUserDropdownOpen) {
        setIsUserDropdownOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isUserDropdownOpen])

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={onToggleSidebar}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-white shadow-lg border border-gray-200"
      >
        {isSidebarOpen ? (
          <X className="w-6 h-6 text-gray-600" />
        ) : (
          <Menu className="w-6 h-6 text-gray-600" />
        )}
      </button>

      {/* Sidebar overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onToggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-white 
        shadow-xl transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col border-r border-gray-200
      `}>
        {/* Header */}
        <div className="flex items-center justify-center h-16 px-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <h1 className="text-xl font-bold text-white">
            LendingPro
          </h1>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative user-dropdown-container">
            <button
              onClick={toggleUserDropdown}
              className="flex items-center w-full p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full text-white text-sm font-semibold shadow-sm">
                {getUserInitials()}
              </div>
              <div className="ml-3 flex-1 text-left">
                <p className="text-sm font-medium text-gray-700">
                  {user ? user.account_name : 'LendingAdmin'}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.role === 'admin' ? 'Administrator' : 'User'}
                </p>
              </div>
              <div className="flex items-center space-x-1">
                {/* Debug indicator */}
                <div className={`w-2 h-2 rounded-full ${isUserDropdownOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                  isUserDropdownOpen ? 'rotate-180' : ''
                }`} />
              </div>
            </button>

            {/* User Dropdown */}
            {isUserDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg transition-colors duration-150">
                  View Profile
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150">
                  Account Settings
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150">
                  Preferences
                </button>
                <div className="border-t border-gray-200">
                  <button 
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-b-lg transition-colors duration-150 flex items-center"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
          {mainMenuSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.title && (
                <h3 className="px-2 mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {section.title}
                </h3>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = activeItem === item.id
                  
                  return (
                    <li key={item.id}>
                                              <button
                          onClick={() => handleMenuItemClick(item.id)}
                          className={`
                            flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium
                            transition-all duration-200 group relative
                            ${isActive 
                              ? 'bg-blue-50 text-blue-700 shadow-sm' 
                              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                            }
                          `}
                        >
                          {isActive && (
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-600 rounded-r-full" />
                          )}
                          <Icon className={`
                            w-5 h-5 mr-3 transition-colors duration-200
                            ${isActive 
                              ? 'text-blue-600' 
                              : 'text-gray-500 group-hover:text-gray-700'
                            }
                          `} />
                          {item.label}
                        </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>



        {/* Version & Update Section */}
        <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600 mb-1">
              LendingPro System Software
            </p>
            <p className="text-xs text-gray-500 mb-1">
              Version: 1.0.3
            </p>
            <p className="text-xs text-green-600 mb-3 font-medium">
              Status: Up to date
            </p>
            <p className="text-xs text-gray-500 mb-3">
              Last checked: 2024-05-01
            </p>
            <button className="flex items-center justify-center w-full px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
              <RefreshCw className="w-3 h-3 mr-2" />
              Update Software
            </button>
          </div>
        </div>
      </div>
    </>
  )
} 