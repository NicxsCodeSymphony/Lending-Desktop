import React, { useState, useEffect } from 'react'
import { X, Wallet, DollarSign, Calendar, CreditCard, FileText, Loader2, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import type { Loan } from '../../utils/DataType/Loans'
import type { Receipts } from '../../utils/DataType/Receipt'
import { useToast } from '../../contexts/ToastContext'
import axios from 'axios'

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
  onPaymentAdded: () => void
  selectedLoan: Loan | null
}

export default function WalletModal({ isOpen, onClose, onPaymentAdded, selectedLoan }: WalletModalProps) {
  const { showSuccess, showError } = useToast()
  const [loading, setLoading] = useState(false)
  const [receipts, setReceipts] = useState<Receipts[]>([])
  const [loadingReceipts, setLoadingReceipts] = useState(false)
  const [formData, setFormData] = useState({
    amount: 0,
    payment_method: 'Cash',
    notes: '',
    pay_id: 0 // 0 means auto-select next unpaid receipt
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // Load receipts when modal opens and loan is selected
  useEffect(() => {
    if (isOpen && selectedLoan) {
      fetchReceipts()
      resetForm()
    }
  }, [isOpen, selectedLoan])

  const fetchReceipts = async () => {
    if (!selectedLoan) return
    
    try {
      setLoadingReceipts(true)
      const res = await axios.get(`http://localhost:45632/loan/getReceipt/${selectedLoan.loan_id}`)
      setReceipts(res.data)
    } catch (err: unknown) {
      if (err instanceof Error) {
        showError('Error Loading Payment Schedule', err.message)
      } else {
        showError('Error Loading Payment Schedule', 'Failed to load payment schedule')
      }
    } finally {
      setLoadingReceipts(false)
    }
  }

  const resetForm = () => {
    setFormData({
      amount: 0,
      payment_method: 'Cash',
      notes: '',
      pay_id: 0
    })
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Payment amount must be greater than 0'
    } else if (formData.amount > 10000000) {
      newErrors.amount = 'Payment amount cannot exceed ₱10,000,000'
    }

    if (!formData.payment_method) {
      newErrors.payment_method = 'Payment method is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !selectedLoan) {
      return
    }

    try {
      setLoading(true)
      
      // Determine which receipt to pay
      let targetPayId = formData.pay_id
      if (targetPayId === 0) {
        // Auto-select the first unpaid receipt
        const firstUnpaid = receipts.find(r => r.status !== 'Paid')
        if (firstUnpaid) {
          targetPayId = firstUnpaid.pay_id
        } else {
          // If all paid, use the last receipt
          targetPayId = receipts[receipts.length - 1]?.pay_id || 1
        }
      }

      const paymentData = {
        amount: formData.amount,
        transaction_time: new Date().toISOString(),
        method: formData.payment_method,
        notes: formData.notes,
        loan_id: selectedLoan.loan_id
      }
      await axios.put(`http://localhost:45632/loan/payLoan/${targetPayId}`, paymentData)
      
      showSuccess('Payment Recorded', `Payment of ${formatCurrency(formData.amount)} has been successfully recorded.`)
      onPaymentAdded()
      handleClose()
    } catch (err: unknown) {
      if (err instanceof Error) {
        showError('Payment Failed', err.message)
      } else {
        showError('Payment Failed', 'Failed to record payment')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      const newErrors = { ...errors }
      delete newErrors[field]
      setErrors(newErrors)
    }
  }

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
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const getNextPaymentAmount = () => {
    if (receipts.length === 0) return 0
    
    const firstUnpaid = receipts.find(r => r.status !== 'Paid')
    if (firstUnpaid) {
      const alreadyPaid = firstUnpaid.amount || 0
      const toPay = firstUnpaid.to_pay || 0
      return Math.max(0, toPay - alreadyPaid)
    }
    return 0
  }

  const getTotalOutstanding = () => {
    return receipts.reduce((total, receipt) => {
      const alreadyPaid = receipt.amount || 0
      const toPay = receipt.to_pay || 0
      return total + Math.max(0, toPay - alreadyPaid)
    }, 0)
  }

  if (!isOpen || !selectedLoan) return null

  const nextPaymentAmount = getNextPaymentAmount()
  const totalOutstanding = getTotalOutstanding()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-all duration-300"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[95vh] overflow-y-auto transform transition-all duration-300 animate-in slide-in-from-bottom-4 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Record Payment</h2>
              <p className="text-sm text-gray-600">Make a payment for loan #{selectedLoan.loan_id}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Payment Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Loan Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Loan Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Customer:</span>
                    <span className="ml-2 font-medium text-gray-900">{selectedLoan.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Loan Amount:</span>
                    <span className="ml-2 font-medium text-gray-900">{formatCurrency(selectedLoan.loan_amount)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Interest Rate:</span>
                    <span className="ml-2 font-medium text-gray-900">{selectedLoan.interest_rate}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Current Balance:</span>
                    <span className={`ml-2 font-medium ${selectedLoan.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(selectedLoan.balance)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Payment Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Payment Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount || ''}
                      onChange={(e) => handleInputChange('amount', e.target.value === '' ? 0 : Number(e.target.value))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                        errors.amount ? 'border-red-300' : 'border-gray-300 hover:border-green-300'
                      }`}
                      placeholder="0.00"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
                      {nextPaymentAmount > 0 && (
                        <button
                          type="button"
                          onClick={() => handleInputChange('amount', nextPaymentAmount)}
                          className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors"
                        >
                          Next: {formatCurrency(nextPaymentAmount)}
                        </button>
                      )}
                      {totalOutstanding > 0 && (
                        <button
                          type="button"
                          onClick={() => handleInputChange('amount', totalOutstanding)}
                          className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded transition-colors"
                        >
                          Full: {formatCurrency(totalOutstanding)}
                        </button>
                      )}
                    </div>
                  </div>
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                  )}
                </div>

                {/* Payment Method and Receipt Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <CreditCard className="w-4 h-4 inline mr-1" />
                      Payment Method <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => handleInputChange('payment_method', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.payment_method ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="Check">Check</option>
                      <option value="Online Payment">Online Payment</option>
                    </select>
                    {errors.payment_method && (
                      <p className="mt-1 text-sm text-red-600">{errors.payment_method}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Apply to Receipt
                    </label>
                    <select
                      value={formData.pay_id}
                      onChange={(e) => handleInputChange('pay_id', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value={0}>Auto (Next Due)</option>
                      {receipts.map((receipt) => (
                        <option key={receipt.pay_id} value={receipt.pay_id}>
                          {formatDate(receipt.schedule)} - {formatCurrency(receipt.to_pay)} 
                          ({receipt.status === 'Paid' ? 'Paid' : 'Unpaid'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="Add any notes about this payment..."
                  />
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
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
                    <span>{loading ? 'Processing...' : 'Record Payment'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column - Payment Schedule */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 sticky top-0 border border-green-100">
                <div className="flex items-center space-x-2 mb-5">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Payment Schedule</h3>
                </div>
                
                {loadingReceipts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                    <span className="ml-2 text-gray-600">Loading schedule...</span>
                  </div>
                ) : receipts.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No payment schedule found</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {receipts.map((receipt, index) => {
                      const alreadyPaid = receipt.amount || 0
                      const toPay = receipt.to_pay || 0
                      const remaining = Math.max(0, toPay - alreadyPaid)
                      const isPaid = receipt.status === 'Paid'
                      
                      return (
                        <div
                          key={receipt.pay_id}
                          className={`p-3 rounded-lg border transition-all duration-200 ${
                            isPaid 
                              ? 'bg-green-100 border-green-200' 
                              : remaining === 0 
                                ? 'bg-yellow-100 border-yellow-200'
                                : 'bg-white border-gray-200 hover:border-green-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {isPaid ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <Clock className="w-4 h-4 text-gray-400" />
                              )}
                              <span className="text-sm font-medium text-gray-700">
                                Payment #{index + 1}
                              </span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              isPaid ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {receipt.status}
                            </span>
                          </div>
                          
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Due:</span>
                              <span className="font-medium">{formatDate(receipt.schedule)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Amount:</span>
                              <span className="font-medium">{formatCurrency(toPay)}</span>
                            </div>
                            {alreadyPaid > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Paid:</span>
                                <span className="font-medium text-green-600">{formatCurrency(alreadyPaid)}</span>
                              </div>
                            )}
                            {remaining > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Remaining:</span>
                                <span className="font-medium text-red-600">{formatCurrency(remaining)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Summary */}
                {receipts.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Outstanding:</span>
                        <span className="font-semibold text-red-600">{formatCurrency(totalOutstanding)}</span>
                      </div>
                      {nextPaymentAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Next Payment:</span>
                          <span className="font-semibold text-blue-600">{formatCurrency(nextPaymentAmount)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 