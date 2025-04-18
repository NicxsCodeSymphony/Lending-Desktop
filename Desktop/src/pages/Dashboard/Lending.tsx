import React, { useState, useEffect } from 'react';
import { fetchLoans } from '../../../utils/lib/LoanServer';
import { Loan } from '../../../utils/lib/Loan';
import { Search, Filter, ArrowUpDown, AlertCircle, DollarSign, Calendar, Clock, Users } from 'lucide-react';
import axios from 'axios';

import AddLoanModal from '../../../components/Modal/AddLoan';
import LoanDetailsModal from '../../../components/ViewLoanDetails'

const LendingPage: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Loan; direction: 'asc' | 'desc' } | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>(undefined);
  
  // Stats
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [avgInterest, setAvgInterest] = useState<number>(0);
  const [activeLoans, setActiveLoans] = useState<number>(0);

  const fetchAllLoans = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await fetchLoans();
      setLoans(res);
      setFilteredLoans(res);
      calculateStats(res);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch loans data. Please try again later.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllLoans();
  }, []);

  const calculateStats = (loanData: Loan[]) => {
    const total = loanData.reduce((sum, loan) => sum + loan.loan_amount, 0);
    setTotalAmount(total);
    const avgInt = loanData.reduce((sum, loan) => sum + loan.interest, 0) / loanData.length || 0;
    setAvgInterest(avgInt);
    const now = new Date();
    const active = loanData.filter(loan => {
      const endDate = new Date(loan.loan_end);
      return endDate > now && loan.overall_balance > 0;
    }).length;
    setActiveLoans(active);
  };

  useEffect(() => {
    const results = loans.filter(loan => 
      loan.customer_id.toString().includes(searchTerm) ||
      loan.loan_id.toString().includes(searchTerm) ||
      loan.loan_amount.toString().includes(searchTerm)
    );
    setFilteredLoans(results);
  }, [searchTerm, loans]);

  const handleSort = (key: keyof Loan) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
    
    const sortedLoans = [...filteredLoans].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredLoans(sortedLoans);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateProgress = (loan: Loan) => {
    const totalAmount = loan.gross_receivable;
    const paidAmount = totalAmount - loan.overall_balance;
    return Math.min(100, Math.max(0, (paidAmount / totalAmount) * 100));
  };

  const handleRefresh = () => {
    fetchAllLoans();
  };

  const handleLoanSelect = (loan: Loan) => {
    setSelectedLoan(loan);
  };

  const handleCloseDetails = () => {
    setSelectedLoan(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Loan Management Dashboard</h1>
            <div>
              <button 
                onClick={handleRefresh}
                className="px-4 py-2 mr-5 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Refresh Data
              </button>

              <button onClick={() => setIsAddModalOpen(true)} className='px-4 py-2 bg-green-600 text-white rounded-md'>
                Add New Loan
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6 flex items-center">
            <div className="rounded-full bg-blue-100 p-3 mr-4">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Loan Amount</p>
              <p className="text-xl font-bold">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 flex items-center">
            <div className="rounded-full bg-green-100 p-3 mr-4">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Loans</p>
              <p className="text-xl font-bold">{activeLoans}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 flex items-center">
            <div className="rounded-full bg-purple-100 p-3 mr-4">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Average Interest Rate</p>
              <p className="text-xl font-bold">{avgInterest.toFixed(2)}%</p>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 mb-4 md:mb-0">Loans Overview</h2>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by ID, customer or amount..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Loans Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2 text-gray-500">Loading loans data...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 flex flex-col items-center">
                <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
                <p className="text-gray-700">{error}</p>
                <button 
                  onClick={handleRefresh}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            ) : filteredLoans.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No loans found matching your search criteria.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('loan_id')}
                    >
                      <div className="flex items-center">
                        Loan ID
                        <ArrowUpDown className="h-4 w-4 ml-1" />
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('customer_id')}
                    >
                      <div className="flex items-center">
                        Customer
                        <ArrowUpDown className="h-4 w-4 ml-1" />
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('loan_amount')}
                    >
                      <div className="flex items-center">
                        Amount
                        <ArrowUpDown className="h-4 w-4 ml-1" />
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('loan_start')}
                    >
                      <div className="flex items-center">
                        Start Date
                        <ArrowUpDown className="h-4 w-4 ml-1" />
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('interest')}
                    >
                      <div className="flex items-center">
                        Interest
                        <ArrowUpDown className="h-4 w-4 ml-1" />
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Progress
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLoans.map((loan) => (
                    <tr key={loan.loan_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{loan.loan_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Customer #{loan.customer_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {formatCurrency(loan.loan_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(loan.loan_start)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {loan.interest}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${calculateProgress(loan)}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatCurrency(loan.gross_receivable - loan.overall_balance)} of {formatCurrency(loan.gross_receivable)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleLoanSelect(loan)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Use the new LoanDetailsModal component */}
      {selectedLoan && (
        <LoanDetailsModal 
          loan={selectedLoan} 
          onClose={handleCloseDetails} 
        />
      )}

      <AddLoanModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        customerId={selectedCustomerId} 
      />
    </div>
  );
};

export default LendingPage;