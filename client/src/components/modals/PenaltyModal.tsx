import React, { useState, useEffect } from 'react'
import { X, AlertOctagon, DollarSign, Calendar, FileText, Search, Loader2 } from 'lucide-react'
import { getLoans } from '../../utils/DataType/LoanServer'
import type { Loan } from '../../utils/DataType/Loans'
import { useToast } from '../../contexts/ToastContext'
import axios from 'axios'

interface PenaltyModalProps {
  isOpen: boolean
  onClose: () => void
  onPenaltyAdded: () => void
  selectedLoan?: Loan | null
}

interface PenaltyFormData {
  loan_id: number
  penalty_amount: number
  reason: string
  transaction_date: string
}

type PenaltyFormErrors = {
  loan_id?: string
  penalty_amount?: string
  reason?: string
  transaction_date?: string
}

export default function PenaltyModal({ isOpen, onClose, onPenaltyAdded, selectedLoan }: PenaltyModalProps) {
  const { showSuccess, showError } = useToast()
  const [loading, setLoading] = useState(false)
  const [loans, setLoans] = useState<Loan[]>([])
  const [loadingLoans, setLoadingLoans] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState<PenaltyFormData>({
    loan_id: 0,
    penalty_amount: 0,
    reason: '',
    transaction_date: ''
  })
  const [errors, setErrors] = useState<PenaltyFormErrors>({})

  // Load loans when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchLoans()
      // Set transaction date to today
      const today = new Date().toISOString().split('T')[0]
      setFormData(prev => ({ ...prev, transaction_date: today }))
    }
  }, [isOpen])

  // Pre-select loan when selectedLoan is provided
  useEffect(() => {
    if (selectedLoan && isOpen) {
      setFormData(prev => ({ 
        ...prev, 
        loan_id: selectedLoan.loan_id 
      }))
    }
  }, [selectedLoan, isOpen])

  const fetchLoans = async () => {
    try {
      setLoadingLoans(true)
      const loanData = await getLoans()
      // Filter to only active loans (can have penalties)
      const activeLoans = loanData.filter(loan => 
        loan.status.toLowerCase() !== 'completed' && 
        loan.status.toLowerCase() !== 'cancelled' &&
        loan.status.toLowerCase() !== 'deleted'
      )
      setLoans(activeLoans)
    } catch (err: unknown) {
      if (err instanceof Error) {
        showError('Error Loading Loans', err.message)
      } else {
        showError('Error Loading Loans', 'Failed to load loan list')
      }
    } finally {
      setLoadingLoans(false)
    }
  }

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0]
    setFormData({
      loan_id: 0,
      penalty_amount: 0,
      reason: '',
      transaction_date: today
    })
    setErrors({} as PenaltyFormErrors)
    setSearchTerm('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const validateForm = (): boolean => {
    const newErrors: PenaltyFormErrors = {}

    if (!formData.loan_id || formData.loan_id === 0) {
      newErrors.loan_id = 'Loan selection is required'
    }

    if (!formData.penalty_amount || formData.penalty_amount <= 0) {
      newErrors.penalty_amount = 'Penalty amount must be greater than 0'
    } else if (formData.penalty_amount > 1000000) {
      newErrors.penalty_amount = 'Penalty amount cannot exceed ₱1,000,000'
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason for penalty is required'
    } else if (formData.reason.length > 500) {
      newErrors.reason = 'Reason cannot exceed 500 characters'
    }

    if (!formData.transaction_date) {
      newErrors.transaction_date = 'Transaction date is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      
      // Call the penalty endpoint
      await axios.put('http://localhost:45632/loan/addPenalty', {
        loan_id: formData.loan_id,
        penalty_amount: formData.penalty_amount,
        reason: formData.reason,
        transaction_date: formData.transaction_date
      })

      const selectedLoan = loans.find(l => l.loan_id === formData.loan_id)
      const loanInfo = selectedLoan 
        ? `#${selectedLoan.loan_id} (${selectedLoan.customer_name})`
        : `#${formData.loan_id}`

      showSuccess(
        'Penalty Added', 
        `Penalty of ₱${formData.penalty_amount.toLocaleString()} added to loan ${loanInfo}`
      )
      
      onPenaltyAdded()
      handleClose()
    } catch (err: unknown) {
      if (err instanceof Error) {
        showError('Penalty Failed', err.message)
      } else {
        showError('Penalty Failed', 'Failed to add penalty')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof PenaltyFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const getFilteredLoans = () => {
    if (!searchTerm) return loans
    
    return loans.filter(loan =>
      loan.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.loan_id.toString().includes(searchTerm) ||
      loan.loan_amount.toString().includes(searchTerm)
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const filteredLoans = getFilteredLoans()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-all duration-300"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[95vh] overflow-y-auto transform transition-all duration-300 animate-in slide-in-from-bottom-4 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-lg">
              <AlertOctagon className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Add Penalty</h2>
              <p className="text-sm text-gray-600">Add penalty charges to an existing loan</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Loan Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Loan <span className="text-red-500">*</span>
              </label>

              {/* Pre-selected Loan Info */}
              {selectedLoan && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                  <div className="text-sm text-orange-800">
                    <span className="font-medium">Selected:</span> #{selectedLoan.loan_id} - {selectedLoan.customer_name}
                    <br />
                    <span className="text-orange-600">
                      Amount: {formatCurrency(selectedLoan.loan_amount)} | Balance: {formatCurrency(selectedLoan.balance)} | Status: {selectedLoan.status}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Search Filter */}
              {!selectedLoan && (
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by customer name, loan ID, or amount..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  />
                </div>
              )}

              {!selectedLoan && (
                loadingLoans ? (
                  <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                    <span className="text-gray-600">Loading loans...</span>
                  </div>
                ) : (
                  <select
                    value={formData.loan_id}
                    onChange={(e) => handleInputChange('loan_id', Number(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                      errors.loan_id ? 'border-red-300' : 'border-gray-300 hover:border-orange-300'
                    }`}
                    size={Math.min(filteredLoans.length + 1, 8)}
                  >
                    <option value={0}>Select a loan to add penalty</option>
                    {filteredLoans.map((loan) => (
                      <option key={loan.loan_id} value={loan.loan_id}>
                        #{loan.loan_id} - {loan.customer_name} - {formatCurrency(loan.loan_amount)} 
                        ({loan.status}) - Balance: {formatCurrency(loan.balance)}
                      </option>
                    ))}
                  </select>
                )
              )}
              
              {errors.loan_id && (
                <p className="mt-1 text-sm text-red-600">{errors.loan_id}</p>
              )}
            </div>

            {/* Penalty Amount and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Penalty Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.penalty_amount || ''}
                  onChange={(e) => handleInputChange('penalty_amount', e.target.value === '' ? 0 : Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                    errors.penalty_amount ? 'border-red-300' : 'border-gray-300 hover:border-orange-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.penalty_amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.penalty_amount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Transaction Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => handleInputChange('transaction_date', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                    errors.transaction_date ? 'border-red-300' : 'border-gray-300 hover:border-orange-300'
                  }`}
                />
                {errors.transaction_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.transaction_date}</p>
                )}
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Reason for Penalty <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                rows={3}
                maxLength={500}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
                  errors.reason ? 'border-red-300' : 'border-gray-300 hover:border-orange-300'
                }`}
                placeholder="Enter the reason for this penalty (e.g., Late payment, Missed payment, etc.)"
              />
              <div className="flex justify-between items-center mt-1">
                {errors.reason && (
                  <p className="text-sm text-red-600">{errors.reason}</p>
                )}
                <p className="text-xs text-gray-500 ml-auto">
                  {formData.reason.length}/500 characters
                </p>
              </div>
            </div>

            {/* Preview */}
            {formData.loan_id > 0 && formData.penalty_amount > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-orange-800 mb-2">Penalty Preview</h3>
                <div className="space-y-1 text-sm text-orange-700">
                  <p><span className="font-medium">Loan:</span> #{formData.loan_id}</p>
                  <p><span className="font-medium">Penalty Amount:</span> {formatCurrency(formData.penalty_amount)}</p>
                  <p><span className="font-medium">Date:</span> {formData.transaction_date}</p>
                  {formData.reason && (
                    <p><span className="font-medium">Reason:</span> {formData.reason}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Adding...' : 'Add Penalty'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 