import { useState } from 'react'
import { 
  Settings as SettingsIcon, 
  Bell,
  Shield,
  Database,
  Download,
  Smartphone,
  User,
  Lock,
  Globe,
  X,
  Save,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react'
import { useSettings } from '../../contexts/SettingsContext'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import { changePassword } from '../../utils/DataType/AuthServer'

export default function Settings() {
  const { 
    settings, 
    updateGeneralSettings, 
    updateNotificationSettings, 
    updateSecuritySettings,
    setTheme,
    exportData,
    createBackup,
    runSecurityAudit,
  } = useSettings()
  const { showSuccess, showError } = useToast()
  const { user } = useAuth()

  // Modal states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false)
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false)
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  // Loading states
  const [loading, setLoading] = useState({
    export: false,
    backup: false,
    audit: false,
    password: false
  })

  const handleGeneralChange = (field: string, value: string) => {
    updateGeneralSettings({ [field]: value })
    showSuccess('Settings Updated', `${field} has been updated successfully.`)
  }

  const handleNotificationToggle = (field: string, value: boolean) => {
    updateNotificationSettings({ [field]: value })
    showSuccess('Notification Updated', `${field} notifications ${value ? 'enabled' : 'disabled'}.`)
  }

  const handleExportData = async () => {
    try {
      setLoading(prev => ({ ...prev, export: true }))
      await exportData()
      showSuccess('Export Complete', 'Your data has been exported successfully.')
    } catch (error) {
      showError('Export Failed', 'Failed to export data. Please try again.')
    } finally {
      setLoading(prev => ({ ...prev, export: false }))
    }
  }

  const handleCreateBackup = async () => {
    try {
      setLoading(prev => ({ ...prev, backup: true }))
      await createBackup()
      showSuccess('Backup Created', 'System backup created successfully.')
    } catch (error) {
      showError('Backup Failed', 'Failed to create backup. Please try again.')
    } finally {
      setLoading(prev => ({ ...prev, backup: false }))
    }
  }

  const handleSecurityAudit = async () => {
    try {
      setLoading(prev => ({ ...prev, audit: true }))
      await runSecurityAudit()
      showSuccess('Security Audit', 'Security audit completed. No issues found.')
    } catch (error) {
      showError('Audit Failed', 'Failed to run security audit. Please try again.')
    } finally {
      setLoading(prev => ({ ...prev, audit: false }))
    }
  }

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError('Password Error', 'New passwords do not match.')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      showError('Password Error', 'Password must be at least 8 characters long.')
      return
    }

    if (!user?.username) {
      showError('Password Error', 'User information not available.')
      return
    }

    try {
      setLoading(prev => ({ ...prev, password: true }))
      
      // Call the real API to change password
      await changePassword({
        username: user.username,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      
      updateSecuritySettings({ 
        lastPasswordChange: new Date().toISOString() 
      })
      
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setIsPasswordModalOpen(false)
      showSuccess('Password Changed', 'Your password has been updated successfully.')
    } catch (error: unknown) {
      let errorMessage = 'Failed to change password. Please try again.'
      
      // Check if it's an axios error with response data
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } }
        if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      showError('Password Error', errorMessage)
    } finally {
      setLoading(prev => ({ ...prev, password: false }))
    }
  }

  const handle2FAToggle = () => {
    const newStatus = !settings.security.twoFactorEnabled
    updateSecuritySettings({ twoFactorEnabled: newStatus })
    showSuccess('2FA Updated', `Two-factor authentication ${newStatus ? 'enabled' : 'disabled'}.`)
    setIs2FAModalOpen(false)
  }

  const handleSessionTimeoutChange = (timeout: number) => {
    updateSecuritySettings({ sessionTimeout: timeout })
    showSuccess('Session Updated', `Session timeout set to ${timeout} minutes.`)
    setIsSessionModalOpen(false)
  }

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Settings
          </h1>
          <p className="text-gray-600">
            Manage your preferences and system configuration.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <SettingsIcon className="w-5 h-5 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">
                  General Settings
                </h3>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">
                    Language
                  </label>
                  <select 
                    value={settings.general.language}
                    onChange={(e) => handleGeneralChange('language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  >
                    <option value="en-US">English (US)</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">
                    Time Zone
                  </label>
                  <select 
                    value={settings.general.timeZone}
                    onChange={(e) => handleGeneralChange('timeZone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  >
                    <option value="UTC-5">UTC-5 (Eastern Time)</option>
                    <option value="UTC-6">UTC-6 (Central Time)</option>
                    <option value="UTC-7">UTC-7 (Mountain Time)</option>
                    <option value="UTC-8">UTC-8 (Pacific Time)</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">
                    Date Format
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                      { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                      { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
                    ].map((format) => (
                      <label key={format.value} className="flex items-center">
                        <input
                          type="radio"
                          name="dateFormat"
                          value={format.value}
                          checked={settings.general.dateFormat === format.value}
                          onChange={(e) => handleGeneralChange('dateFormat', e.target.value)}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{format.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">
                    Theme
                  </label>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Dark Mode
                      </p>
                      <p className="text-xs text-gray-500">
                        Switch between light and dark theme
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={settings.theme === 'dark'}
                        onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <Bell className="w-5 h-5 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Notifications
                </h3>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {[
                  { key: 'email', label: 'Email notifications', desc: 'Receive updates via email' },
                  { key: 'push', label: 'Push notifications', desc: 'Browser push notifications' },
                  { key: 'sms', label: 'SMS alerts', desc: 'Important alerts via SMS' },
                  { key: 'weeklyReports', label: 'Weekly reports', desc: 'Receive weekly summary reports' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.desc}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={settings.notifications[item.key as keyof typeof settings.notifications]}
                        onChange={(e) => handleNotificationToggle(item.key, e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Security
                </h3>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <button 
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left border border-gray-200"
                >
                  <div className="flex items-center">
                    <Lock className="w-5 h-5 text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Change Password
                      </p>
                      <p className="text-xs text-gray-500">
                        Update your account password
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>

                <button 
                  onClick={() => setIs2FAModalOpen(true)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left border border-gray-200"
                >
                  <div className="flex items-center">
                    <User className="w-5 h-5 text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Two-Factor Authentication
                      </p>
                      <p className="text-xs text-gray-500">
                        {settings.security.twoFactorEnabled ? 'Currently enabled' : 'Add an extra layer of security'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {settings.security.twoFactorEnabled && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    <span className="text-gray-400">→</span>
                  </div>
                </button>

                <button 
                  onClick={() => setIsSessionModalOpen(true)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left border border-gray-200"
                >
                  <div className="flex items-center">
                    <Globe className="w-5 h-5 text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Session Management
                      </p>
                      <p className="text-xs text-gray-500">
                        Timeout: {settings.security.sessionTimeout} minutes
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Quick Actions
              </h3>
            </div>
            
            <div className="p-6 space-y-3">
              <button 
                onClick={handleExportData}
                disabled={loading.export}
                className="w-full flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left disabled:opacity-50"
              >
                {loading.export ? (
                  <Loader2 className="w-5 h-5 text-gray-500 mr-3 animate-spin" />
                ) : (
                  <Download className="w-5 h-5 text-gray-500 mr-3" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Export Data
                  </p>
                  <p className="text-xs text-gray-500">
                    Download your data
                  </p>
                </div>
              </button>

              <button 
                onClick={handleCreateBackup}
                disabled={loading.backup}
                className="w-full flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left disabled:opacity-50"
              >
                {loading.backup ? (
                  <Loader2 className="w-5 h-5 text-gray-500 mr-3 animate-spin" />
                ) : (
                  <Database className="w-5 h-5 text-gray-500 mr-3" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Backup
                  </p>
                  <p className="text-xs text-gray-500">
                    Create system backup
                  </p>
                </div>
              </button>

              <button 
                onClick={handleSecurityAudit}
                disabled={loading.audit}
                className="w-full flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left disabled:opacity-50"
              >
                {loading.audit ? (
                  <Loader2 className="w-5 h-5 text-gray-500 mr-3 animate-spin" />
                ) : (
                  <Shield className="w-5 h-5 text-gray-500 mr-3" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Security Audit
                  </p>
                  <p className="text-xs text-gray-500">
                    Run security check
                  </p>
                </div>
              </button>

              <button className="w-full flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left">
                <Smartphone className="w-5 h-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Mobile App
                  </p>
                  <p className="text-xs text-gray-500">
                    Download mobile app
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              System Info
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Version:</span>
                <span className="font-medium text-gray-900">{settings.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Update:</span>
                <span className="font-medium text-gray-900">2024-05-01</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Environment:</span>
                <span className="font-medium text-gray-900">Production</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Server Status:</span>
                <span className="font-medium text-green-600">Online</span>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Need Help?
            </h3>
            <p className="text-sm text-blue-700 mb-4">
              Contact our support team for assistance with your account or system configuration.
            </p>
            <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200">
              Contact Support
            </button>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={loading.password || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {loading.password ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Changing...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Change Password</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Modal */}
      {is2FAModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Two-Factor Authentication</h2>
              <button
                onClick={() => setIs2FAModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                settings.security.twoFactorEnabled ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {settings.security.twoFactorEnabled ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <Shield className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-gray-600">
                {settings.security.twoFactorEnabled 
                  ? 'Two-factor authentication is currently enabled for your account.'
                  : 'Add an extra layer of security to your account with two-factor authentication.'
                }
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIs2FAModalOpen(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handle2FAToggle}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  settings.security.twoFactorEnabled
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {settings.security.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Management Modal */}
      {isSessionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Session Management</h2>
              <button
                onClick={() => setIsSessionModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                <select
                  value={settings.security.sessionTimeout}
                  onChange={(e) => handleSessionTimeoutChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={240}>4 hours</option>
                  <option value={480}>8 hours</option>
                </select>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Current Session Info</h4>
                <div className="space-y-1 text-xs text-gray-600">
                  <p>Started: {new Date().toLocaleString()}</p>
                  <p>Browser: Chrome</p>
                  <p>IP Address: 192.168.1.1</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setIsSessionModalOpen(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 