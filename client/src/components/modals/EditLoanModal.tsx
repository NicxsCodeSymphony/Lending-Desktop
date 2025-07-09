import React, { useState, useEffect, useCallback } from 'react'
import { X, DollarSign, Calendar, User, Percent, Clock, Loader2, Settings } from 'lucide-react'
import { editLoan } from '../../utils/DataType/LoanServer'
import { getCustomers } from '../../utils/DataType/CustomerServer'
import type { Loan, EditLoan } from '../../utils/DataType/Loans'
import type { Customer } from '../../utils/DataType/Customers'
import { useToast } from '../../contexts/ToastContext'

interface EditLoanModalProps {
  isOpen: boolean
  onClose: () => void
  onLoanUpdated: () => void
  loan: Loan | null
}

export default function EditLoanModal({ isOpen, onClose, onLoanUpdated, loan }: EditLoanModalProps) {
  const { showSuccess, showError } = useToast()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [formData, setFormData] = useState<Omit<EditLoan, 'updated_at'>>({
    loan_id: 0,
    customer_id: 0,
    loan_amount: 0,
    interest_rate: 0,
    payment_schedule: 'Monthly',
    terms_months: 12,
    start_date: '',
    due_date: '',
    status: 'Pending'
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // Load customers when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCustomers()
    }
  }, [isOpen])

  // Pre-fill form when loan changes
  useEffect(() => {
    if (loan) {
      setFormData({
        loan_id: loan.loan_id,
        customer_id: loan.customer_id,
        loan_amount: loan.loan_amount,
        interest_rate: loan.interest_rate,
        payment_schedule: loan.payment_schedule,
        terms_months: loan.terms_months,
        start_date: loan.start_date.split('T')[0], // Format date for input
        due_date: loan.due_date.split('T')[0], // Format date for input
        status: loan.status
      })
      setErrors({})
    }
  }, [loan])

  // Calculate due date when start date or terms change
  useEffect(() => {
    if (formData.start_date && formData.terms_months && loan) {
      const startDate = new Date(formData.start_date)
      const dueDate = new Date(startDate)
      dueDate.setMonth(dueDate.getMonth() + formData.terms_months)
      setFormData(prev => ({ 
        ...prev, 
        due_date: dueDate.toISOString().split('T')[0] 
      }))
    }
  }, [formData.start_date, formData.terms_months, loan])

  const fetchCustomers = useCallback(async () => {
    try {
      setLoadingCustomers(true)
      const customerData = await getCustomers()
      // Include all customers (including deleted ones) for editing purposes
      setCustomers(customerData)
    } catch (err: unknown) {
      if (err instanceof Error) {
        showError('Error Loading Customers', err.message)
      } else {
        showError('Error Loading Customers', 'Failed to load customer list')
      }
    } finally {
      setLoadingCustomers(false)
    }
  }, [showError])

  const resetForm = () => {
    setFormData({
      loan_id: 0,
      customer_id: 0,
      loan_amount: 0,
      interest_rate: 0,
      payment_schedule: 'Monthly',
      terms_months: 12,
      start_date: '',
      due_date: '',
      status: 'Pending'
    })
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.customer_id || formData.customer_id === 0) {
      newErrors.customer_id = 'Customer selection is required'
    }

    if (!formData.loan_amount || formData.loan_amount <= 0) {
      newErrors.loan_amount = 'Loan amount must be greater than 0'
    } else if (formData.loan_amount > 10000000) {
      newErrors.loan_amount = 'Loan amount cannot exceed ₱10,000,000'
    }

    if (!formData.interest_rate || formData.interest_rate < 0) {
      newErrors.interest_rate = 'Interest rate must be 0 or greater'
    } else if (formData.interest_rate > 100) {
      newErrors.interest_rate = 'Interest rate cannot exceed 100%'
    }

    if (!formData.terms_months || formData.terms_months <= 0) {
      newErrors.terms_months = 'Terms must be greater than 0 months'
    } else if (formData.terms_months > 120) {
      newErrors.terms_months = 'Terms cannot exceed 120 months'
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required'
    }

    if (!formData.due_date) {
      newErrors.due_date = 'Due date is required'
    }

    if (!formData.status) {
      newErrors.status = 'Status is required'
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
      const editData: EditLoan = {
        ...formData,
        updated_at: new Date().toISOString()
      }
      await editLoan(editData)
      const selectedCustomer = customers.find(c => c.customer_id === formData.customer_id)
      const customerName = selectedCustomer 
        ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}`
        : 'Customer'
      showSuccess('Loan Updated', `Loan for ${customerName} has been successfully updated.`)
      onLoanUpdated()
      handleClose()
    } catch (err: unknown) {
      if (err instanceof Error) {
        showError('Update Failed', err.message)
      } else {
        showError('Update Failed', 'Failed to update loan')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof Omit<EditLoan, 'updated_at'>, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      const newErrors = { ...errors }
      delete newErrors[field]
      setErrors(newErrors)
    }
  }

  const getCalculatedValues = () => {
    const interestAmount = (formData.loan_amount * formData.interest_rate) / 100
    const totalAmount = formData.loan_amount + interestAmount
    const monthlyPayment = formData.terms_months > 0 ? totalAmount / formData.terms_months : 0
    
    return {
      interestAmount,
      totalAmount,
      monthlyPayment
    }
  }

  const { interestAmount, totalAmount, monthlyPayment } = getCalculatedValues()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  if (!isOpen || !loan) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
              <Settings className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit Loan</h2>
              <p className="text-sm text-gray-600">Update loan information below</p>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Loan ID Display */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Loan ID:</span>
                  <span className="text-sm text-gray-900 font-mono">#{loan.loan_id}</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-sm text-gray-600">Created: {formatDate(loan.created_at)}</span>
                </div>
              </div>

              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Customer <span className="text-red-500">*</span>
                </label>
                {loadingCustomers ? (
                  <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-gray-600">Loading customers...</span>
                  </div>
                ) : (
                  <select
                    value={formData.customer_id}
                    onChange={(e) => handleInputChange('customer_id', Number(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.customer_id ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value={0}>Select a customer</option>
                    {customers.map((customer) => (
                      <option key={customer.customer_id} value={customer.customer_id}>
                        {customer.first_name} {customer.last_name} - {customer.contact}
                      </option>
                    ))}
                  </select>
                )}
                {errors.customer_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.customer_id}</p>
                )}
              </div>

              {/* Loan Amount and Interest Rate */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Loan Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.loan_amount || ''}
                    onChange={(e) => handleInputChange('loan_amount', Number(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.loan_amount ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {errors.loan_amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.loan_amount}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Percent className="w-4 h-4 inline mr-1" />
                    Interest Rate (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.interest_rate || ''}
                    onChange={(e) => handleInputChange('interest_rate', Number(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.interest_rate ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {errors.interest_rate && (
                    <p className="mt-1 text-sm text-red-600">{errors.interest_rate}</p>
                  )}
                </div>
              </div>

              {/* Payment Schedule and Terms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Payment Schedule <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.payment_schedule}
                    onChange={(e) => handleInputChange('payment_schedule', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Semi-Annual">Semi-Annual</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Terms (Months) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={formData.terms_months || ''}
                    onChange={(e) => handleInputChange('terms_months', Number(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.terms_months ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="12"
                  />
                  {errors.terms_months && (
                    <p className="mt-1 text-sm text-red-600">{errors.terms_months}</p>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.start_date ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.start_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => handleInputChange('due_date', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.due_date ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.due_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.due_date}</p>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    errors.status ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="Pending">Pending</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                )}
              </div>
            </div>

            {/* Right Column - Loan Summary */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg p-6 sticky top-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Summary</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Principal Amount:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(formData.loan_amount || 0)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Interest Amount:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(interestAmount)}</span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                      <span className="font-bold text-gray-900">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Monthly Payment:</span>
                    <span className="font-medium text-green-600">{formatCurrency(monthlyPayment)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Payment Schedule:</span>
                    <span className="font-medium text-gray-900">{formData.payment_schedule}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Terms:</span>
                    <span className="font-medium text-gray-900">{formData.terms_months} months</span>
                  </div>

                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current Balance:</span>
                      <span className={`font-medium ${loan.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(loan.balance)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Updating...' : 'Update Loan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 