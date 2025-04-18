import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loan } from '../../utils/lib/Loan';
import { CalendarDays, DollarSign, Percent, CreditCard, Calculator } from 'lucide-react';

interface AddLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId?: number; // Optional - if provided, pre-fills customer ID
}

const AddLoanModal: React.FC<AddLoanModalProps> = ({ isOpen, onClose, customerId }) => {
  const [formData, setFormData] = useState({
    customer_id: customerId || '',
    loan_start: formatDate(new Date()),
    months: 12,
    loan_end: '',
    transaction_date: formatDate(new Date()),
    loan_amount: 5000,
    interest: 5,
    gross_receivable: 0,
    payday_payment: 0,
    service: 0,
    balance: 0,
    adjustment: 0,
    overall_balance: 0
  });

  const [customers, setCustomers] = useState<{id: number, name: string}[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Fetch customers for dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await axios.get('http://localhost:3002/customers');
        const formattedCustomers = res.data.map((customer: any) => ({
          id: customer.customer_id,
          name: `${customer.first_name} ${customer.last_name}`
        }));
        setCustomers(formattedCustomers);
      } catch (err) {
        console.error("Failed to fetch customers:", err);
      }
    };
    
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen]);

  // Calculate loan end date and other values when relevant fields change
  useEffect(() => {
    if (formData.loan_start && formData.months) {
      // Calculate loan end date
      const startDate = new Date(formData.loan_start);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + parseInt(String(formData.months)));
      
      // Calculate other loan values
      const principal = parseFloat(String(formData.loan_amount));
      const interestRate = parseFloat(String(formData.interest)) / 100;
      const months = parseInt(String(formData.months));
      
      // Service fee (typically 5% of principal)
      const serviceFee = principal * 0.05;
      
      // Simple interest calculation (Principal × Rate × Time)
      // const interestAmount = principal * interestRate * (months / 12);
      const interestAmount = principal * interestRate
      
      // Gross receivable
      const grossReceivable = (principal + interestAmount);
      const adjustment = parseFloat(String(formData.adjustment)) || 0;
      const withAdjustments = grossReceivable + adjustment;

      // Monthly payment
      const monthlyPayment = withAdjustments / months;
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        loan_end: formatDate(endDate),
        service: serviceFee,
        gross_receivable: withAdjustments,
        payday_payment: monthlyPayment,
        balance: withAdjustments,
        overall_balance: withAdjustments
      }));
    }
  }, [formData.loan_start, formData.adjustment, formData.months, formData.loan_amount, formData.interest]);

  function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateLoan = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
    }, 800); // Simulate calculation with short delay for better UX
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_id || !formData.loan_amount || !formData.months) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const payload = {
        ...formData,
        customer_id: Number(formData.customer_id),
        loan_amount: Number(formData.loan_amount),
        months: Number(formData.months),
        interest: Number(formData.interest),
        gross_receivable: Number(formData.gross_receivable),
        payday_payment: Number(formData.payday_payment),
        service: Number(formData.service),
        balance: Number(formData.balance),
        adjustment: Number(formData.adjustment),
        overall_balance: Number(formData.overall_balance)
      };
      
      const res = await axios.post('http://localhost:3002/loan', payload);

      if (res.status === 201) {
        resetForm();
        onClose();
        window.location.reload();
      }
    } catch (err) {
      console.error("Failed to add loan: ", err);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: customerId || '',
      loan_start: formatDate(new Date()),
      months: 12,
      loan_end: '',
      transaction_date: formatDate(new Date()),
      loan_amount: 5000,
      interest: 5,
      gross_receivable: 0,
      payday_payment: 0,
      service: 0,
      balance: 0,
      adjustment: 0,
      overall_balance: 0
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Add New Loan</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Customer Selection */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-3">Customer Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer</label>
                <select
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Loan Terms */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-800 mb-3">Loan Terms</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <DollarSign className="w-4 h-4 mr-1 text-green-600" />
                    Loan Amount
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">$</span>
                    <input
                      type="number"
                      name="loan_amount"
                      value={formData.loan_amount}
                      onChange={handleChange}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                      min="1"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <Percent className="w-4 h-4 mr-1 text-green-600" />
                    Interest Rate (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="interest"
                      value={formData.interest}
                      onChange={handleChange}
                      className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                      min="0"
                      step="0.01"
                    />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">%</span>
                  </div>
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <DollarSign className="w-4 h-4 mr-1 text-green-600" />
                    Adjustments
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="adjustment"
                      value={formData.adjustment}
                      onChange={handleChange}
                      className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                      min="0"
                      step="0.01"
                    />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <CalendarDays className="w-4 h-4 mr-1 text-green-600" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="loan_start"
                    value={formData.loan_start}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <CreditCard className="w-4 h-4 mr-1 text-green-600" />
                    Duration (months)
                  </label>
                  <input
                    type="number"
                    name="months"
                    value={formData.months}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                    min="1"
                    max="60"
                  />
                </div>
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <CalendarDays className="w-4 h-4 mr-1 text-green-600" />
                    End Date
                  </label>
                  <input
                    type="date"
                    name="loan_end"
                    value={formData.loan_end}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
                </div>
              </div>
            </div>

            {/* Calculated Values */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-purple-800">Calculated Values</h3>
                <button
                  type="button"
                  onClick={calculateLoan}
                  className="flex items-center text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                >
                  <Calculator className="w-3 h-3 mr-1" />
                  Recalculate
                </button>
              </div>
              
              <div className={`transition-opacity duration-300 ${isCalculating ? 'opacity-50' : 'opacity-100'}`}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Service Fee</label>
                    <div className="bg-white px-3 py-2 border border-gray-300 rounded-md text-gray-700">
                      ${formData.service.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Gross Receivable</label>
                    <div className="bg-white px-3 py-2 border border-gray-300 rounded-md text-gray-700">
                      ${formData.gross_receivable.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Monthly Payment</label>
                    <div className="bg-white px-3 py-2 border border-gray-300 rounded-md font-medium text-blue-600">
                      ${formData.payday_payment.toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Initial Balance</label>
                  <div className="bg-white px-3 py-2 border border-gray-300 rounded-md text-gray-700">
                    ${formData.balance.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-6 pt-6 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Transaction Date:</span> {new Date(formData.transaction_date).toLocaleDateString()}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Create Loan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLoanModal;