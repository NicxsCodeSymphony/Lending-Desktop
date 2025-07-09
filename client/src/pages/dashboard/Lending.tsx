import React, { useState, useEffect } from 'react'
import { DollarSign, Plus, Search, TrendingUp, AlertTriangle, CheckCircle, Clock, XCircle, Edit, Trash2, Loader2, AlertCircle, ChevronLeft, ChevronRight, Wallet, AlertOctagon, FileText, Download } from 'lucide-react'
import { getLoans, deleteLoan, getLoanStats, recalculateAllLoanBalances } from '../../utils/DataType/LoanServer'
import { getCustomers } from '../../utils/DataType/CustomerServer'
import { fetchReceipt } from '../../utils/DataType/ReceiptServer'
import type { Loan, LoanStats } from '../../utils/DataType/Loans'
import type { Customer } from '../../utils/DataType/Customers'
import type { Receipts } from '../../utils/DataType/Receipt'
import { useToast } from '../../contexts/ToastContext'
import { useSettings } from '../../contexts/SettingsContext'
import AddLoanModal from '../../components/modals/AddLoanModal'
import EditLoanModal from '../../components/modals/EditLoanModal'
import PenaltyModal from '../../components/modals/PenaltyModal'
import WalletModal from '../../components/modals/WalletModal'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function Lending() {
  const { showSuccess, showError } = useToast()
  const { formatCurrency, formatDate } = useSettings()
  const [loans, setLoans] = useState<Loan[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [receipts, setReceipts] = useState<Receipts[]>([])
  const [stats, setStats] = useState<LoanStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPenaltyModalOpen, setIsPenaltyModalOpen] = useState(false)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)

  // Report options state
  const [reportType, setReportType] = useState<'all' | 'customer' | 'batch'>('all')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [fileFormat, setFileFormat] = useState<'excel' | 'pdf'>('pdf')
  const [reportGenerating, setReportGenerating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    setCurrentPage(1) // Reset to first page when filters change
  }, [statusFilter, searchTerm, entriesPerPage])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // First recalculate balances to ensure data is up-to-date
      await recalculateAllLoanBalances()
      
      const [loansData, statsData, customersData, receiptsData] = await Promise.all([
        getLoans(),
        getLoanStats(),
        getCustomers(),
        fetchReceipt()
      ])
      setLoans(loansData)
      setStats(statsData)
      setCustomers(customersData)
      setReceipts(receiptsData)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to fetch lending data')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLoan = async (loanId: number) => {
    if (window.confirm('Are you sure you want to delete this loan?')) {
      try {
        await deleteLoan(loanId)
        setLoans(loans.filter(loan => loan.loan_id !== loanId))
        showSuccess('Loan Deleted', 'Loan has been successfully deleted.')
        // Refresh stats after deletion
        const updatedStats = await getLoanStats()
        setStats(updatedStats)
      } catch (err: unknown) {
        if (err instanceof Error) {
          showError('Delete Failed', err.message)
        } else {
          showError('Delete Failed', 'Failed to delete loan')
        }
      }
    }
  }

  const handleLoanAdded = () => {
    fetchData() // Refresh loans and stats
  }

  const handleEditLoan = (loan: Loan) => {
    setSelectedLoan(loan)
    setIsEditModalOpen(true)
  }

  const handleLoanUpdated = () => {
    fetchData() // Refresh loans and stats
    setSelectedLoan(null)
  }

  const handlePenaltyAdded = () => {
    fetchData() // Refresh loans and stats after penalty is added
  }

  const handleAddPenalty = (loan: Loan) => {
    setSelectedLoan(loan)
    setIsPenaltyModalOpen(true)
  }

  const handleWalletAction = (loan: Loan) => {
    setSelectedLoan(loan)
    setIsWalletModalOpen(true)
  }

  const handlePaymentAdded = () => {
    fetchData() // Refresh loans and stats after payment is added
  }

  const getReportData = () => {
    let reportLoans = loans

    // Filter based on report type
    if (reportType === 'customer' && selectedCustomerId) {
      reportLoans = loans.filter(loan => loan.customer_id.toString() === selectedCustomerId)
    } else if (reportType === 'batch' && (dateRange.start || dateRange.end)) {
      reportLoans = loans.filter(loan => {
        const loanDate = new Date(loan.start_date)
        const startDate = dateRange.start ? new Date(dateRange.start) : null
        const endDate = dateRange.end ? new Date(dateRange.end) : null
        
        if (startDate && endDate) {
          return loanDate >= startDate && loanDate <= endDate
        } else if (startDate) {
          return loanDate >= startDate
        } else if (endDate) {
          return loanDate <= endDate
        }
        return true
      })
    }

    return reportLoans
  }

  const generateReport = async () => {
    try {
      setReportGenerating(true)
      const reportData = getReportData()
      
      if (reportData.length === 0) {
        showError('No Data', 'No loans found for the selected criteria.')
        return
      }

      if (fileFormat === 'excel') {
        await generateExcelReport(reportData)
      } else {
        await generatePDFReport(reportData)
      }

      showSuccess('Report Generated', `Financial report has been downloaded as ${fileFormat.toUpperCase()}.`)
      setIsReportModalOpen(false)
    } catch (err: unknown) {
      if (err instanceof Error) {
        showError('Export Failed', err.message)
      } else {
        showError('Export Failed', 'Failed to generate report')
      }
    } finally {
      setReportGenerating(false)
    }
  }

    const generateExcelReport = async (reportLoans: Loan[]) => {
    try {
      // Prepare data for Excel
      const excelData = reportLoans.map(loan => ({
        'Loan ID': loan.loan_id,
        'Customer Name': loan.customer_name,
        'Loan Amount': loan.loan_amount,
        'Interest Rate (%)': loan.interest_rate,
        'Interest Amount': loan.interest_amount,
        'Notes Receivable': loan.notes_receivable,
        'Balance': loan.balance || 0,
        'Penalty': loan.penalty,
        'Status': loan.status,
        'Start Date': new Date(loan.start_date).toLocaleDateString(),
        'Due Date': new Date(loan.due_date).toLocaleDateString(),
        'Terms (Months)': loan.terms_months
      }))

      // Add summary row
      const summary = {
        'Loan ID': 'SUMMARY',
        'Customer Name': '',
        'Loan Amount': reportLoans.reduce((sum, loan) => sum + loan.loan_amount, 0),
        'Interest Rate (%)': '',
        'Interest Amount': reportLoans.reduce((sum, loan) => sum + loan.interest_amount, 0),
        'Notes Receivable': reportLoans.reduce((sum, loan) => sum + loan.notes_receivable, 0),
        'Balance': reportLoans.reduce((sum, loan) => sum + (loan.balance || 0), 0),
        'Penalty': reportLoans.reduce((sum, loan) => sum + loan.penalty, 0),
        'Status': '',
        'Start Date': '',
        'Due Date': '',
        'Terms (Months)': ''
      }

      const finalData = [...excelData, summary]

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(finalData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Lending Report')

      // Generate filename
      const today = new Date().toISOString().split('T')[0]
      const filename = `lending-report-${reportType}-${today}.xlsx`

      // Download file
      XLSX.writeFile(wb, filename)
    } catch (error) {
      showError('Export Failed', `Excel export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error('Excel export error:', error)
    }
  }

  const generatePDFReport = async (reportLoans: Loan[]) => {
    try {
      const doc = new jsPDF()
      
      // Header
      doc.setFontSize(20)
      doc.text('FINANCIAL LENDING REPORT', 105, 20, { align: 'center' })
      
      doc.setFontSize(12)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35)
      doc.text(`Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`, 20, 45)
      
      let currentY = 55
      
      if (reportType === 'customer' && selectedCustomerId) {
        const customer = customers.find(c => c.customer_id.toString() === selectedCustomerId)
        doc.text(`Customer: ${customer?.first_name} ${customer?.last_name}`, 20, currentY)
        currentY += 10
      }
      
      if (reportType === 'batch' && (dateRange.start || dateRange.end)) {
        let dateText = 'Date Range: '
        if (dateRange.start && dateRange.end) {
          dateText += `${dateRange.start} to ${dateRange.end}`
        } else if (dateRange.start) {
          dateText += `From ${dateRange.start}`
        } else if (dateRange.end) {
          dateText += `Until ${dateRange.end}`
        }
        doc.text(dateText, 20, currentY)
        currentY += 10
      }

      // Table data
      const tableData = reportLoans.map(loan => [
        loan.loan_id.toString(),
        loan.customer_name,
        formatCurrency(loan.loan_amount),
        `${loan.interest_rate}%`,
        formatCurrency(loan.notes_receivable),
        formatCurrency(loan.balance || 0),
        formatCurrency(loan.penalty),
        loan.status,
        new Date(loan.start_date).toLocaleDateString()
      ])

      // Table using autoTable
      autoTable(doc, {
        startY: currentY + 10,
        head: [['Loan ID', 'Customer', 'Amount', 'Interest', 'Receivable', 'Balance', 'Penalty', 'Status', 'Start Date']],
        body: tableData,
        styles: {
          fontSize: 8,
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          lineColor: [0, 0, 0],
          lineWidth: 0.1
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        },
        tableLineColor: [0, 0, 0],
        tableLineWidth: 0.1
      })

      // Summary - get the final Y position from the last autoTable
      const docWithTable = doc as { lastAutoTable?: { finalY: number } }
      const finalY = (docWithTable.lastAutoTable?.finalY || 100) + 15
      doc.setFontSize(12)
      doc.setFont(undefined, 'bold')
      doc.text('SUMMARY', 20, finalY)
      
      doc.setFont(undefined, 'normal')
      doc.setFontSize(10)
      const totalLoaned = reportLoans.reduce((sum, loan) => sum + loan.loan_amount, 0)
      const totalReceivable = reportLoans.reduce((sum, loan) => sum + loan.notes_receivable, 0)
      const totalBalance = reportLoans.reduce((sum, loan) => sum + (loan.balance || 0), 0)
      const totalPenalty = reportLoans.reduce((sum, loan) => sum + loan.penalty, 0)
      const collectionRate = totalReceivable > 0 ? (((totalReceivable - totalBalance) / totalReceivable) * 100).toFixed(1) : '0'
      
      doc.text(`Total Loans: ${reportLoans.length}`, 20, finalY + 15)
      doc.text(`Total Amount Loaned: ${formatCurrency(totalLoaned)}`, 20, finalY + 25)
      doc.text(`Total Notes Receivable: ${formatCurrency(totalReceivable)}`, 20, finalY + 35)
      doc.text(`Total Outstanding Balance: ${formatCurrency(totalBalance)}`, 20, finalY + 45)
      doc.text(`Total Penalties: ${formatCurrency(totalPenalty)}`, 20, finalY + 55)
      doc.text(`Collection Rate: ${collectionRate}%`, 20, finalY + 65)

      // Generate filename and download
      const today = new Date().toISOString().split('T')[0]
      const filename = `lending-report-${reportType}-${today}.pdf`
      doc.save(filename)
    } catch (error) {
      showError('Export Failed', `PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error('PDF export error:', error)
    }
  }

  const getFilteredLoans = () => {
    let filtered = loans

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(loan => loan.status.toLowerCase() === statusFilter.toLowerCase())
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(loan =>
        loan.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.loan_id.toString().includes(searchTerm) ||
        loan.loan_amount.toString().includes(searchTerm)
      )
    }

    return filtered
  }

  const filteredLoans = getFilteredLoans()

  // Pagination logic
  const totalPages = Math.ceil(filteredLoans.length / entriesPerPage)
  const startIndex = (currentPage - 1) * entriesPerPage
  const endIndex = startIndex + entriesPerPage
  const currentLoans = filteredLoans.slice(startIndex, endIndex)

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'partial':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircle className="w-3 h-3" />
      case 'partial':
        return <TrendingUp className="w-3 h-3" />
      case 'pending':
        return <Clock className="w-3 h-3" />
      case 'completed':
        return <CheckCircle className="w-3 h-3" />
      case 'overdue':
        return <AlertTriangle className="w-3 h-3" />
      case 'cancelled':
        return <XCircle className="w-3 h-3" />
      default:
        return <Clock className="w-3 h-3" />
    }
  }



  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    return pages
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading lending data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <div>
            <h3 className="text-red-800 font-medium">Error Loading Lending Data</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button 
              onClick={fetchData}
              className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lending Management</h1>
          <p className="text-gray-600 text-sm mt-1">Manage loans, track payments, and monitor performance</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button 
            onClick={async () => {
              try {
                setLoading(true)
                await recalculateAllLoanBalances()
                await fetchData()
                showSuccess('Balances Updated', 'All loan balances have been recalculated based on payments.')
              } catch (err: unknown) {
                if (err instanceof Error) {
                  showError('Recalculation Failed', err.message)
                } else {
                  showError('Recalculation Failed', 'Failed to recalculate balances')
                }
              }
            }}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
            <span>Refresh Balances</span>
          </button>
          <button 
            onClick={() => setIsReportModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Report</span>
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Loan</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-7 mb-8">
          {/* Active Loans */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 lg:p-7 hover:shadow-lg transition-shadow min-h-[120px]">
            <div className="flex items-start justify-between h-full">
              <div className="flex-1 pr-4">
                <p className="text-sm font-medium text-gray-600 mb-2">Active Loans</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.active_loans || 0}</p>
              </div>
              <div className="flex-shrink-0">
                <div className="bg-green-100 p-3 lg:p-4 rounded-lg">
                  <CheckCircle className="w-6 h-6 lg:w-7 lg:h-7 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Total Disbursed */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 lg:p-7 hover:shadow-lg transition-shadow min-h-[120px]">
            <div className="flex items-start justify-between h-full">
              <div className="flex-1 pr-4">
                <p className="text-sm font-medium text-gray-600 mb-2">Total Disbursed</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900 break-words">{formatCurrency(stats.total_amount_disbursed || 0)}</p>
              </div>
              <div className="flex-shrink-0">
                <div className="bg-blue-100 p-3 lg:p-4 rounded-lg">
                  <DollarSign className="w-6 h-6 lg:w-7 lg:h-7 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Pending Loans */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 lg:p-7 hover:shadow-lg transition-shadow min-h-[120px]">
            <div className="flex items-start justify-between h-full">
              <div className="flex-1 pr-4">
                <p className="text-sm font-medium text-gray-600 mb-2">Pending Loans</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.pending_loans || 0}</p>
              </div>
              <div className="flex-shrink-0">
                <div className="bg-yellow-100 p-3 lg:p-4 rounded-lg">
                  <Clock className="w-6 h-6 lg:w-7 lg:h-7 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Outstanding Balance */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 lg:p-7 hover:shadow-lg transition-shadow min-h-[120px]">
            <div className="flex items-start justify-between h-full">
              <div className="flex-1 pr-4">
                <p className="text-sm font-medium text-gray-600 mb-2">Outstanding</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900 break-words">{formatCurrency(stats.total_outstanding_balance || 0)}</p>
              </div>
              <div className="flex-shrink-0">
                <div className="bg-orange-100 p-3 lg:p-4 rounded-lg">
                  <TrendingUp className="w-6 h-6 lg:w-7 lg:h-7 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Interest Earned */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 lg:p-7 hover:shadow-lg transition-shadow min-h-[120px]">
            <div className="flex items-start justify-between h-full">
              <div className="flex-1 pr-4">
                <p className="text-sm font-medium text-gray-600 mb-2">Interest Earned</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900 break-words">{formatCurrency(stats.total_interest_earned || 0)}</p>
              </div>
              <div className="flex-shrink-0">
                <div className="bg-purple-100 p-3 lg:p-4 rounded-lg">
                  <DollarSign className="w-6 h-6 lg:w-7 lg:h-7 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Collection Rate */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 lg:p-7 hover:shadow-lg transition-shadow min-h-[120px]">
            <div className="flex items-start justify-between h-full">
              <div className="flex-1 pr-4">
                <p className="text-sm font-medium text-gray-600 mb-2">Collection Rate</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900">{(stats.collection_rate || 0).toFixed(1)}%</p>
              </div>
              <div className="flex-shrink-0">
                <div className="bg-indigo-100 p-3 lg:p-4 rounded-lg">
                  <TrendingUp className="w-6 h-6 lg:w-7 lg:h-7 text-indigo-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Total Collected */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 lg:p-7 hover:shadow-lg transition-shadow min-h-[120px]">
            <div className="flex items-start justify-between h-full">
              <div className="flex-1 pr-4">
                <p className="text-sm font-medium text-gray-600 mb-2">Total Collected</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900 break-words">
                  {formatCurrency((() => {
                    // Calculate total collected directly from actual payments (receipts) - same as dashboard
                    return receipts.reduce((sum, receipt) => {
                      return sum + (receipt.amount || 0)
                    }, 0)
                  })())}
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="bg-emerald-100 p-3 lg:p-4 rounded-lg">
                  <DollarSign className="w-6 h-6 lg:w-7 lg:h-7 text-emerald-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by customer, loan ID, or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes Receivable</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Penalty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentLoans.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <DollarSign className="w-12 h-12 text-gray-400" />
                      <p className="text-gray-500 font-medium">No loans found</p>
                      <p className="text-gray-400 text-sm">
                        {searchTerm || statusFilter !== 'all' 
                          ? 'Try adjusting your search or filters'
                          : 'Get started by creating your first loan'
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentLoans.map((loan) => (
                  <tr key={loan.loan_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">#{loan.loan_id}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {loan.customer_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{loan.customer_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(loan.loan_amount)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{loan.interest_rate}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(loan.notes_receivable)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${(() => {
                        // Completed loans should always show 0 balance
                        const displayBalance = loan.status.toLowerCase() === 'completed' ? 0 : loan.balance
                        return displayBalance > 0 ? 'text-red-600' : 'text-green-600'
                      })()}`}>
                        {formatCurrency(loan.status.toLowerCase() === 'completed' ? 0 : loan.balance)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${loan.penalty > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {formatCurrency(loan.penalty)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(loan.status)}`}>
                        {getStatusIcon(loan.status)}
                        <span>{loan.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(loan.start_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        {loan.status.toLowerCase() !== 'completed' && loan.status.toLowerCase() !== 'cancelled' ? (
                          <>
                            <button 
                              onClick={() => handleEditLoan(loan)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit loan"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleWalletAction(loan)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Wallet actions"
                            >
                              <Wallet className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleAddPenalty(loan)}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Add penalty"
                            >
                              <AlertOctagon className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteLoan(loan.loan_id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete loan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs italic px-2 py-1 capitalize">
                            {loan.status}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredLoans.length > 0 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Entries Info */}
              <div className="flex items-center space-x-4">
                <p className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredLoans.length)} of {filteredLoans.length} entries
                </p>
                <select
                  value={entriesPerPage}
                  onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  «
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 text-sm border rounded ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Page {page}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  »
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddLoanModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onLoanAdded={handleLoanAdded}
      />

      <EditLoanModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onLoanUpdated={handleLoanUpdated}
        loan={selectedLoan}
      />

      <PenaltyModal
        isOpen={isPenaltyModalOpen}
        onClose={() => {
          setIsPenaltyModalOpen(false)
          setSelectedLoan(null)
        }}
        onPenaltyAdded={handlePenaltyAdded}
        selectedLoan={selectedLoan}
      />

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => {
          setIsWalletModalOpen(false)
          setSelectedLoan(null)
        }}
        onPaymentAdded={handlePaymentAdded}
        selectedLoan={selectedLoan}
      />

      {/* Report Generation Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Generate Financial Report</h2>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Report Type</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="reportType"
                      value="all"
                      checked={reportType === 'all'}
                      onChange={(e) => setReportType(e.target.value as 'all' | 'customer' | 'batch')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">All Loans</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="reportType"
                      value="customer"
                      checked={reportType === 'customer'}
                      onChange={(e) => setReportType(e.target.value as 'all' | 'customer' | 'batch')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Single Customer</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="reportType"
                      value="batch"
                      checked={reportType === 'batch'}
                      onChange={(e) => setReportType(e.target.value as 'all' | 'customer' | 'batch')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Date Range (Batch)</span>
                  </label>
                </div>
              </div>

              {/* Customer Selection */}
              {reportType === 'customer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Customer</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose a customer...</option>
                    {customers.map((customer) => (
                      <option key={customer.customer_id} value={customer.customer_id.toString()}>
                        {customer.first_name} {customer.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date Range Selection */}
              {reportType === 'batch' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* File Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">File Format</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="fileFormat"
                      value="pdf"
                      checked={fileFormat === 'pdf'}
                      onChange={(e) => setFileFormat(e.target.value as 'excel' | 'pdf')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">PDF</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="fileFormat"
                      value="excel"
                      checked={fileFormat === 'excel'}
                      onChange={(e) => setFileFormat(e.target.value as 'excel' | 'pdf')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Excel</span>
                  </label>
                </div>
              </div>

              {/* Summary Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Report Preview</h3>
                <p className="text-sm text-gray-600">
                  {(() => {
                    const reportData = getReportData()
                    return `${reportData.length} loan(s) will be included in this report.`
                  })()}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={generateReport}
                disabled={reportGenerating || (reportType === 'customer' && !selectedCustomerId)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {reportGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Generate Report</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 