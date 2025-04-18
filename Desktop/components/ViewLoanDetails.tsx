import React, { useState, useEffect } from 'react';
import { 
  User, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  Clock, 
  FileText, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  CreditCardIcon
} from 'lucide-react';

import axios from 'axios';

import { Loan } from '../utils/lib/Loan';
import {Receipts} from '../utils/lib/Receipt'

interface LoanDetailsModalProps {
  loan: Loan | null;
  onClose: () => void;
}

const fetchReceiptsByLoanId = async (loanId: number): Promise<Receipts[]> => {
  try {
    const response = await fetch(`http://localhost:3002/loan/getReceipt/${loanId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch receipts');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching receipts:', error);
    throw error;
  }
};

const LoanDetailsModal: React.FC<LoanDetailsModalProps> = ({ loan, onClose }) => {
  const [receipts, setReceipts] = useState<Receipts[]>([]);
  const [isLoadingReceipts, setIsLoadingReceipts] = useState<boolean>(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'payments'>('overview');
  const [expandedSection, setExpandedSection] = useState<string>('all');
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentProcessing, setPaymentProcessing] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (loan) {
      fetchLoanReceipts(loan.loan_id);
    }
  }, [loan]);

  const fetchLoanReceipts = async (loanId: number) => {
    setIsLoadingReceipts(true);
    setReceiptError(null);
    try {
      const receiptData = await fetchReceiptsByLoanId(loanId);
      setReceipts(receiptData);
    } catch (err) {
      console.error(err);
      setReceiptError('Failed to fetch receipt data.');
    } finally {
      setIsLoadingReceipts(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateProgress = (loan: Loan): number => {
    const totalAmount = loan.gross_receivable;
    const paidAmount = totalAmount - loan.overall_balance;
    return Math.min(100, Math.max(0, (paidAmount / totalAmount) * 100));
  };

  const toggleSection = (section: string): void => {
    if (expandedSection === section) {
      setExpandedSection('all');
    } else {
      setExpandedSection(section);
    }
  };

  // Function to determine status badge color
  const getStatusBadgeColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to get status icon
  const getStatusIcon = (status: string): JSX.Element => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'overdue':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  // Function to sort receipts by schedule date
  const sortedReceipts = (): Receipts[] => {
    return [...receipts].sort((a, b) => new Date(a.schedule).getTime() - new Date(b.schedule).getTime());
  };

  const handlePayClick = (receiptId: number, dueAmount: number): void => {
    setSelectedReceiptId(receiptId);
    setPaymentAmount(dueAmount.toString());
    setShowPaymentModal(true);
    setPaymentSuccess(false);
  };

  const handlePaymentSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    const now = new Date();
const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    if (!selectedReceiptId || !paymentAmount || isNaN(parseFloat(paymentAmount))) return;

    setPaymentProcessing(true);


    try {
      
      const res = await axios.put(`http://localhost:3002/loan/payLoan/${selectedReceiptId}`,{
        amount: paymentAmount,
        transaction_time: formattedDate
      })
      
      if(res.status === 200){
    setPaymentSuccess(true);
        setTimeout(() => {
          setShowPaymentModal(false);
          setPaymentSuccess(false);
          window.location.reload()
        }, 3000);
      }
    } catch (error) {
      console.error('Payment processing error:', error);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handlePaymentAmountChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    // Allow only numbers and decimal point
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setPaymentAmount(value);
  };

  if (!loan) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <FileText className="h-6 w-6 mr-3" />
              <h3 className="text-xl font-medium">Loan #{loan.loan_id} Details</h3>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex mt-6 border-b border-blue-500">
            <button 
              className={`py-2 px-4 mr-4 font-medium ${activeTab === 'overview' ? 'bg-white text-blue-600 rounded-t-lg' : 'text-blue-100 hover:text-white'}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`py-2 px-4 mr-4 font-medium ${activeTab === 'payments' ? 'bg-white text-blue-600 rounded-t-lg' : 'text-blue-100 hover:text-white'}`}
              onClick={() => setActiveTab('payments')}
            >
              Payment History
            </button>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <>
              {/* Summary Card */}
              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <div className="rounded-full bg-blue-100 p-2">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">Principal</p>
                    <p className="text-lg font-bold">{formatCurrency(loan.loan_amount)}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <div className="rounded-full bg-green-100 p-2">
                        <CreditCard className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">Monthly Payment</p>
                    <p className="text-lg font-bold">{formatCurrency(loan.payday_payment)}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <div className="rounded-full bg-purple-100 p-2">
                        <Calendar className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="text-lg font-bold">{loan.months} months</p>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <div className="rounded-full bg-red-100 p-2">
                        <Clock className="h-5 w-5 text-red-600" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">Outstanding</p>
                    <p className="text-lg font-bold">{formatCurrency(loan.overall_balance)}</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between mb-2 items-center">
                  <h4 className="text-base font-medium text-gray-700">Payment Progress</h4>
                  <div className="text-sm font-medium text-blue-600">
                    {calculateProgress(loan).toFixed(0)}% Complete
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-blue-600 h-4 rounded-full text-xs text-white flex items-center justify-center transition-all duration-500" 
                    style={{ width: `${calculateProgress(loan)}%` }}
                  >
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-sm text-gray-500">
                  <span>Paid: {formatCurrency(loan.gross_receivable - loan.overall_balance)}</span>
                  <span>Total: {formatCurrency(loan.gross_receivable)}</span>
                </div>
              </div>
              
              {/* Collapsible Sections */}
              {/* Customer Information Section */}
              <div className="border rounded-lg mb-4 overflow-hidden shadow-sm hover:shadow transition-shadow duration-200">
                <button 
                  className="flex justify-between items-center w-full p-4 bg-gray-50 hover:bg-gray-100"
                  onClick={() => toggleSection('customer')}
                >
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-500 mr-2" />
                    <h4 className="text-base font-medium text-gray-700">Customer Information</h4>
                  </div>
                  {expandedSection === 'customer' || expandedSection === 'all' ? 
                    <ChevronUp className="h-5 w-5 text-gray-500" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  }
                </button>
                {(expandedSection === 'customer' || expandedSection === 'all') && (
                  <div className="p-4 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Customer ID</p>
                        <p className="font-medium">{loan.customer_id}</p>
                      </div>
                      {/* Add more customer details here when available */}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Loan Period Section */}
              <div className="border rounded-lg mb-4 overflow-hidden shadow-sm hover:shadow transition-shadow duration-200">
                <button 
                  className="flex justify-between items-center w-full p-4 bg-gray-50 hover:bg-gray-100"
                  onClick={() => toggleSection('period')}
                >
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                    <h4 className="text-base font-medium text-gray-700">Loan Period</h4>
                  </div>
                  {expandedSection === 'period' || expandedSection === 'all' ? 
                    <ChevronUp className="h-5 w-5 text-gray-500" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  }
                </button>
                {(expandedSection === 'period' || expandedSection === 'all') && (
                  <div className="p-4 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Start Date</p>
                        <p className="font-medium">{formatDate(loan.loan_start)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">End Date</p>
                        <p className="font-medium">{formatDate(loan.loan_end)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Duration</p>
                        <p className="font-medium">{loan.months} months</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Financial Details Section */}
              <div className="border rounded-lg mb-4 overflow-hidden shadow-sm hover:shadow transition-shadow duration-200">
                <button 
                  className="flex justify-between items-center w-full p-4 bg-gray-50 hover:bg-gray-100"
                  onClick={() => toggleSection('financial')}
                >
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-gray-500 mr-2" />
                    <h4 className="text-base font-medium text-gray-700">Financial Details</h4>
                  </div>
                  {expandedSection === 'financial' || expandedSection === 'all' ? 
                    <ChevronUp className="h-5 w-5 text-gray-500" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  }
                </button>
                {(expandedSection === 'financial' || expandedSection === 'all') && (
                  <div className="p-4 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Principal Amount</p>
                        <p className="font-medium">{formatCurrency(loan.loan_amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Interest Rate</p>
                        <p className="font-medium">{loan.interest}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Service Fee</p>
                        <p className="font-medium">{formatCurrency(loan.service)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Gross Receivable</p>
                        <p className="font-medium">{formatCurrency(loan.gross_receivable)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Payment Information Section */}
              <div className="border rounded-lg mb-4 overflow-hidden shadow-sm hover:shadow transition-shadow duration-200">
                <button 
                  className="flex justify-between items-center w-full p-4 bg-gray-50 hover:bg-gray-100"
                  onClick={() => toggleSection('payment')}
                >
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-gray-500 mr-2" />
                    <h4 className="text-base font-medium text-gray-700">Payment Information</h4>
                  </div>
                  {expandedSection === 'payment' || expandedSection === 'all' ? 
                    <ChevronUp className="h-5 w-5 text-gray-500" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  }
                </button>
                {(expandedSection === 'payment' || expandedSection === 'all') && (
                  <div className="p-4 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Monthly Payment</p>
                        <p className="font-medium">{formatCurrency(loan.payday_payment)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Outstanding Balance</p>
                        <p className="font-medium">{formatCurrency(loan.balance)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Adjustments</p>
                        <p className="font-medium">{formatCurrency(loan.adjustment)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Overall Balance</p>
                        <p className="font-medium text-blue-600">{formatCurrency(loan.overall_balance)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Transaction Information Section */}
              <div className="border rounded-lg mb-4 overflow-hidden shadow-sm hover:shadow transition-shadow duration-200">
                <button 
                  className="flex justify-between items-center w-full p-4 bg-gray-50 hover:bg-gray-100"
                  onClick={() => toggleSection('transaction')}
                >
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-500 mr-2" />
                    <h4 className="text-base font-medium text-gray-700">Transaction Information</h4>
                  </div>
                  {expandedSection === 'transaction' || expandedSection === 'all' ? 
                    <ChevronUp className="h-5 w-5 text-gray-500" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  }
                </button>
                {(expandedSection === 'transaction' || expandedSection === 'all') && (
                  <div className="p-4 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Transaction Date</p>
                        <p className="font-medium">{formatDate(loan.transaction_date)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Last Updated</p>
                        <p className="font-medium">{formatDate(loan.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          
          {activeTab === 'payments' && (
            <div className="mt-2">
              <h4 className="text-lg font-medium text-gray-700 mb-4">Payment History</h4>
              
              {isLoadingReceipts ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-500">Loading payment history...</p>
                </div>
              ) : receiptError ? (
                <div className="text-center py-12 bg-red-50 rounded-lg">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                  <p className="text-gray-700 font-medium">{receiptError}</p>
                  <button 
                    onClick={() => fetchLoanReceipts(loan.loan_id)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : receipts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No payment records found for this loan.</p>
                </div>
              ) : (
                <div className="bg-white border rounded-lg overflow-hidden shadow">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Receipt ID
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Schedule Date
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount Due
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount Paid
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Transaction Date
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sortedReceipts().map((receipt) => (
                          <tr key={receipt.pay_id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{receipt.pay_id}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(receipt.schedule)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(receipt.to_pay)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(receipt.amount)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {receipt.transaction_date ? formatDate(receipt.transaction_date) : '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <div className="flex items-center">
                                {getStatusIcon(receipt.status)}
                                <span className={`ml-1.5 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(receipt.status)}`}>
                                  {receipt.status}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {receipt.status.toLowerCase() !== 'paid' && (
                                <button
                                  onClick={() => handlePayClick(receipt.pay_id, receipt.to_pay)}
                                  className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                >
                                  <CreditCardIcon className="h-4 w-4 mr-1" />
                                  Pay Now
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 mr-3 flex items-center transition-colors"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Close
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center transition-colors"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit Loan
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
            <div className="bg-green-600 p-4 text-white">
              <h3 className="text-lg font-medium flex items-center">
                <CreditCardIcon className="h-5 w-5 mr-2" />
                Make a Payment
              </h3>
            </div>
            
            <form onSubmit={handlePaymentSubmit} className="p-6">
              {paymentSuccess ? (
                <div className="text-center py-6">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="mt-3 text-lg font-medium text-gray-900">Payment Successful!</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Your payment has been processed successfully.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <label htmlFor="receipt-id" className="block text-sm font-medium text-gray-700 mb-1">
                        Receipt ID
                      </label>
                      <input
                        type="text"
                        id="receipt-id"
                        className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                        value={`#${selectedReceiptId}`}
                        disabled
                      />
                    </div>
                    <div className="mb-6">
                      <label htmlFor="payment-amount" className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Amount
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">₱</span>
                        </div>
                        <input
                          type="text"
                          id="payment-amount"
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                          placeholder="0.00"
                          value={paymentAmount}
                          onChange={handlePaymentAmountChange}
                          autoFocus
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">PHP</span>
                        </div>
                      </div>
                    </div>
                    {/* <div className="mb-6">
                      <label htmlFor="payment-method" className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method
                      </label>
                      <select
                        id="payment-method"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option>Credit Card</option>
                        <option>Bank Transfer</option>
                        <option>Cash</option>
                      </select>
                    </div> */}
                    {/* <div className="mb-6">
                      <label htmlFor="payment-notes" className="block text-sm font-medium text-gray-700 mb-1">
                        Notes (Optional)
                      </label>
                      <textarea
                        id="payment-notes"
                        rows={3}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                        placeholder="Add any additional notes here..."
                      />
                    </div> */}
                  </>
                )}
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    disabled={paymentProcessing}
                  >
                    Cancel
                  </button>
                  {!paymentSuccess && (
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors flex items-center"
                      disabled={paymentProcessing}
                    >
                      {paymentProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCardIcon className="h-4 w-4 mr-1" />
                          Complete Payment
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
};

export default LoanDetailsModal;