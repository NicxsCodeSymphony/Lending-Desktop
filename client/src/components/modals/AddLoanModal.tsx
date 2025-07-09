import React, { useState, useEffect, useCallback } from 'react'
import { X, DollarSign, Calendar, User, Percent, Clock, Loader2 } from 'lucide-react'
import { addLoan } from '../../utils/DataType/LoanServer'
import { getCustomers } from '../../utils/DataType/CustomerServer'
import type { AddLoan } from '../../utils/DataType/Loans'
import type { Customer } from '../../utils/DataType/Customers'
import { useToast } from '../../contexts/ToastContext'

interface AddLoanModalProps {
  isOpen: boolean
  onClose: () => void
  onLoanAdded: () => void
}

type AddLoanErrors = {
  customer_id?: string
  loan_amount?: string
  interest_rate?: string
  payment_schedule?: string
  terms_months?: string
  start_date?: string
  due_date?: string
}

export default function AddLoanModal({ isOpen, onClose, onLoanAdded }: AddLoanModalProps) {
  const { showSuccess, showError } = useToast()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [formData, setFormData] = useState<AddLoan>({
    customer_id: 0,
    loan_amount: 0,
    interest_rate: 5,
    payment_schedule: 'Monthly',
    terms_months: 12,
    start_date: '',
    due_date: ''
  })
  const [errors, setErrors] = useState<AddLoanErrors>({})

  // Load customers and set start date when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCustomers()
      // Set start date to today automatically
      const today = new Date().toISOString().split('T')[0]
      setFormData(prev => ({ ...prev, start_date: today }))
    }
  }, [isOpen])

  // Calculate due date when start date or terms change
  useEffect(() => {
    if (formData.start_date && formData.terms_months) {
      const startDate = new Date(formData.start_date)
      const dueDate = new Date(startDate)
      dueDate.setMonth(dueDate.getMonth() + formData.terms_months)
      setFormData(prev => ({ 
        ...prev, 
        due_date: dueDate.toISOString().split('T')[0] 
      }))
    }
  }, [formData.start_date, formData.terms_months])

  const fetchCustomers = useCallback(async () => {
    try {
      setLoadingCustomers(true)
      const customerData = await getCustomers()
      // Filter out deleted customers
      const activeCustomers = customerData.filter(customer => 
        customer.status.toLowerCase() !== 'deleted'
      )
      setCustomers(activeCustomers)
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
    const today = new Date().toISOString().split('T')[0]
    setFormData({
      customer_id: 0,
      loan_amount: 0,
      interest_rate: 0,
      payment_schedule: 'Monthly',
      terms_months: 12,
      start_date: today,
      due_date: ''
    })
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const validateForm = (): boolean => {
    const newErrors: AddLoanErrors = {}

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
    } else {
      const startDate = new Date(formData.start_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (startDate < today) {
        newErrors.start_date = 'Start date cannot be in the past'
      }
    }

    if (!formData.due_date) {
      newErrors.due_date = 'Due date is required'
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
      await addLoan(formData)
      const selectedCustomer = customers.find(c => c.customer_id === formData.customer_id)
      const customerName = selectedCustomer 
        ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}`
        : 'Customer'
      showSuccess('Loan Created', `Loan for ${customerName} has been successfully created.`)
      onLoanAdded()
      handleClose()
    } catch (err: unknown) {
      if (err instanceof Error) {
        showError('Create Failed', err.message)
      } else {
        showError('Create Failed', 'Failed to create loan')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof AddLoan, value: string | number) => {
    let processedValue: string | number = value
    
    // Convert string to number for numeric fields
    if (typeof value === 'string' && ['customer_id', 'loan_amount', 'interest_rate', 'terms_months'].includes(field)) {
      processedValue = value === '' ? 0 : Number(value)
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }))
    if (errors[field as keyof AddLoanErrors]) {
      setErrors(prev => ({ ...prev, [field as keyof AddLoanErrors]: undefined }))
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-all duration-300"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 max-h-[95vh] overflow-y-auto transform transition-all duration-300 animate-in slide-in-from-bottom-4 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Create New Loan</h2>
              <p className="text-sm text-gray-600">Fill in the loan information below</p>
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
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                    onChange={(e) => handleInputChange('loan_amount', e.target.value === '' ? 0 : Number(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.loan_amount ? 'border-red-300 shake' : 'border-gray-300 hover:border-blue-300'
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
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
                    Start Date <span className="text-green-600 text-xs">(Auto: Today)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-green-50 transition-all duration-200 ${
                      errors.start_date ? 'border-red-300' : 'border-green-300'
                    }`}
                    title="Automatically set to today's date"
                  />
                  {errors.start_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Due Date <span className="text-blue-600 text-xs">(Auto: +{formData.terms_months} months)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    readOnly
                    className={`w-full px-3 py-2 border rounded-lg bg-blue-50 border-blue-300 cursor-not-allowed transition-all duration-200 ${
                      errors.due_date ? 'border-red-300' : 'border-blue-300'
                    }`}
                    title={`Automatically calculated: ${formData.terms_months} months from start date`}
                  />
                  {errors.due_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.due_date}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Loan Calculator */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 sticky top-0 border border-blue-100">
                <div className="flex items-center space-x-2 mb-5">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Loan Calculator</h3>
                </div>
                
                <div className="space-y-4">
                  {/* Principal Amount */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">Principal Amount</span>
                      <span className="text-xs text-gray-500">Base loan</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900 transition-all duration-300">
                      {formatCurrency(formData.loan_amount || 0)}
                    </div>
                  </div>
                  
                  {/* Interest Calculation */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">Interest Amount</span>
                      <span className="text-xs text-gray-500">{formData.interest_rate}% rate</span>
                    </div>
                    <div className="text-xl font-bold text-orange-600 transition-all duration-300">
                      {formatCurrency(interestAmount)}
                    </div>
                  </div>
                  
                  {/* Total Amount */}
                  <div className="bg-blue-600 rounded-lg p-4 shadow-md border-2 border-blue-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-white">Total Amount</span>
                      <span className="text-xs text-blue-100">Principal + Interest</span>
                    </div>
                    <div className="text-2xl font-bold text-white transition-all duration-300">
                      {formatCurrency(totalAmount)}
                    </div>
                  </div>
                  
                  {/* Payment Breakdown */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-700">Payment Schedule</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        {formData.payment_schedule}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Per Payment:</span>
                        <span className="font-semibold text-green-600 transition-all duration-300">
                          {formatCurrency(monthlyPayment)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Number of Payments:</span>
                        <span className="font-medium text-gray-900">{formData.terms_months}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-sm text-gray-600">Total Duration:</span>
                        <span className="font-medium text-gray-900">
                          {Math.floor(formData.terms_months / 12)} years {formData.terms_months % 12} months
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Adjustments */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <div className="text-sm font-medium text-gray-700 mb-3">Quick Adjustments</div>
                    
                    {/* Interest Rate Adjustment */}
                    <div className="mb-3">
                      <label className="text-xs text-gray-600 mb-1 block">Adjust Interest Rate (%)</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          step="0.1"
                          min="-100"
                          max="100"
                          placeholder="±%"
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const adjustment = Number((e.target as HTMLInputElement).value)
                              if (!isNaN(adjustment)) {
                                const newRate = Math.max(0, Math.min(100, formData.interest_rate + adjustment))
                                handleInputChange('interest_rate', newRate)
                                ;(e.target as HTMLInputElement).value = ''
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            const input = (e.currentTarget.previousElementSibling as HTMLInputElement)
                            const adjustment = Number(input.value)
                            if (!isNaN(adjustment)) {
                              const newRate = Math.max(0, Math.min(100, formData.interest_rate + adjustment))
                              handleInputChange('interest_rate', newRate)
                              input.value = ''
                            }
                          }}
                          className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                    </div>

                    {/* Terms Adjustment */}
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Adjust Terms (months)</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="-120"
                          max="120"
                          placeholder="±months"
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const adjustment = Number((e.target as HTMLInputElement).value)
                              if (!isNaN(adjustment)) {
                                const newTerms = Math.max(1, Math.min(120, formData.terms_months + adjustment))
                                handleInputChange('terms_months', newTerms)
                                ;(e.target as HTMLInputElement).value = ''
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            const input = (e.currentTarget.previousElementSibling as HTMLInputElement)
                            const adjustment = Number(input.value)
                            if (!isNaN(adjustment)) {
                              const newTerms = Math.max(1, Math.min(120, formData.terms_months + adjustment))
                              handleInputChange('terms_months', newTerms)
                              input.value = ''
                            }
                          }}
                          className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                        >
                          Apply
                        </button>
                      </div>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Creating...' : 'Create Loan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 