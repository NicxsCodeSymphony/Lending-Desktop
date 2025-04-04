import axios from "axios";
import { useState, useEffect } from "react";
import type { Loan, Receipt, LoanFormData } from "../../utils/lib/Loan";
import '../../styles/Lending.css'
import { fetchLoans, fetchReceipts } from "../../utils/LoanServer";
import { fetchCustomers } from "../../utils/CustomerServer";

const Lending: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<LoanFormData>({
    customer_id: "",
    loan_start: new Date().toISOString().split("T")[0],
    months: 6,
    loan_end: "",
    transaction_date: new Date().toISOString().split("T")[0],
    loan_amount: 0,
    interest: 0.1,
    gross_receivable: 0,
    payday_payment: 0,
    service: 0,
    balance: 0,
    adjustment: 0,
    overall_balance: 0,
    status: ""
  });
  const [customers, setCustomers] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState({ message: "", type: "" });
  const [activeTab, setActiveTab] = useState('info');

  const getReceiptStatusClass = (receipt: Receipt) => {
    const dueDate = new Date(receipt.schedule);
    const today = new Date();
    if (receipt.amount < receipt.to_pay && dueDate < today) {
      return 'overdue';
    }
    return '';
  };

  useEffect(() => {
    if (formData.loan_start && formData.months) {
      const startDate = new Date(formData.loan_start);
      startDate.setMonth(startDate.getMonth() + formData.months);
      setFormData(prev => ({
        ...prev,
        loan_end: startDate.toISOString().split("T")[0]
      }));
    }
  }, [formData.loan_start, formData.months]);

  useEffect(() => {
    const amount = formData.loan_amount;
    const interestRate = formData.interest;
    const months = formData.months;
    
    if (amount && interestRate && months) {
      const interest = amount * interestRate;
      const gross = amount + interest;
      const payment = gross / months;
      
      setFormData(prev => ({
        ...prev,
        gross_receivable: gross,
        payday_payment: payment,
        balance: gross,
        overall_balance: gross
      }));
    }
  }, [formData.loan_amount, formData.interest, formData.months]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === "months" || name === "loan_amount" || name === "interest" || name === "service" || name === "adjustment" ? 
        parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:3002/loan", formData);
      setStatusMessage({ message: response.data, type: "success" });
      setIsModalOpen(false);
      resetForm();
      fetchLoans();
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ 
        message: err.response?.data?.error || "Error creating loan", 
        type: "error" 
      });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.put(`http://localhost:3002/loan/${selectedLoan.loan_id}`, formData);
      setStatusMessage({ message: "Loan updated successfully", type: "success" });
      setIsModalOpen(false);
      setIsEditMode(false);
      resetForm();
      fetchLoans();
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ 
        message: err.response?.data?.error || "Error updating loan", 
        type: "error" 
      });
    }
  };

  const handleDelete = async (loanId: number) => {
    if (window.confirm("Are you sure you want to delete this loan?")) {
      try {
        await axios.delete(`http://localhost:3002/loan/${loanId}`);
        setStatusMessage({ message: "Loan deleted successfully", type: "success" });
        fetchLoans();
      } catch (err: any) {
        console.error(err);
        setStatusMessage({ 
          message: err.response?.data?.error || "Error deleting loan", 
          type: "error" 
        });
      }
    }
  };

  const handleEdit = (loan: any) => {
    setSelectedLoan(loan);
    setFormData({
      customer_id: loan.customer_id,
      loan_start: loan.loan_start.split("T")[0],
      months: loan.months,
      loan_end: loan.loan_end.split("T")[0],
      transaction_date: loan.transaction_date.split("T")[0],
      loan_amount: loan.loan_amount,
      interest: loan.interest,
      gross_receivable: loan.gross_receivable,
      payday_payment: loan.payday_payment,
      service: loan.service,
      balance: loan.balance,
      adjustment: loan.adjustment,
      overall_balance: loan.overall_balance,
      status: loan.status
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleViewDetails = async (loan: any) => {
    setSelectedLoan(loan);
    const receipt = await fetchReceipts(loan.loan_id);
    setReceipts(receipt as Receipt[])
    setIsDetailsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      customer_id: "",
      loan_start: new Date().toISOString().split("T")[0],
      months: 6,
      loan_end: "",
      transaction_date: new Date().toISOString().split("T")[0],
      loan_amount: 0,
      interest: 0.1,
      gross_receivable: 0,
      payday_payment: 0,
      service: 0,
      balance: 0,
      adjustment: 0,
      overall_balance: 0,
      status: ""
    });
    setSelectedLoan(null);
  };

  const openNewLoanModal = () => {
    resetForm();
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  useEffect(() => {
    const fetchLoan = async () => {
      const res = await fetchLoans();
      if (res) {
        setLoans(res);
      }
    };
  
    const fetchCus = async () => {
      const cus = await fetchCustomers();
      if (cus) {
        setCustomers(cus);
      }
    };
  
    fetchLoan();
    fetchCus();
  }, []);
  

  return (
    <div className="lending-container">
      <header className="lending-header">
        <h1>Loan Management System</h1>
        <button 
          className="btn btn-primary" 
          onClick={openNewLoanModal}
        >
          Add New Loan
        </button>
      </header>
      
      {statusMessage.message && (
        <div className={`status-message ${statusMessage.type}`}>
          {statusMessage.message}
          <button onClick={() => setStatusMessage({ message: "", type: "" })}>×</button>
        </div>
      )}

      <div className="loans-container">
        <h2>Active Loans</h2>
        
        <div className="loan-cards">
          {loans.length > 0 ? (
            loans.map((loan: Loan) => (
              <div key={loan.loan_id} className="loan-card">
                <div className="loan-card-header">
                  <h3>Loan #{loan.loan_id}</h3>
                  <span className="customer-id">Customer: {loan.first_name} {loan.last_name}</span>
                </div>
                
                <div className="loan-card-body">
                  <div className="loan-info">
                    <div className="info-group">
                      <label>Amount:</label>
                      <span>{formatCurrency(loan.loan_amount)}</span>
                    </div>
                    <div className="info-group">
                      <label>Period:</label>
                      <span>{loan.months} months</span>
                    </div>
                    <div className="info-group">
                      <label>Start Date:</label>
                      <span>{formatDate(loan.loan_start)}</span>
                    </div>
                    <div className="info-group">
                      <label>End Date:</label>
                      <span>{formatDate(loan.loan_end)}</span>
                    </div>
                  </div>
                  
                  <div className="loan-financials">
                    <div className="info-group highlight">
                      <label>Monthly Payment:</label>
                      <span>{formatCurrency(loan.payday_payment)}</span>
                    </div>
                    <div className="info-group">
                      <label>Balance:</label>
                      <span>{formatCurrency(loan.balance)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="loan-card-footer">
                  <button 
                    className="btn btn-info"
                    onClick={() => handleViewDetails(loan)}
                  >
                    View Details
                  </button>
                  <button 
                    className="btn btn-warning"
                    onClick={() => handleEdit(loan)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => handleDelete(loan.loan_id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-loans">
              <p>No loans found. Create a new loan to get started.</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>{isEditMode ? "Update Loan" : "Create New Loan"}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={isEditMode ? handleUpdate : handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="customer_id">Customer</label>
                    <select 
                      id="customer_id"
                      name="customer_id"
                      value={formData.customer_id}
                      onChange={handleInputChange}
                      required
                      className="form-select"
                    >
                      <option value="">Select a customer</option>
                      {customers.map(customer => (
                        <option key={customer.customer_id} value={customer.customer_id}>
                          {customer.name} ({customer.first_name + " " + customer.last_name})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="loan_amount">Loan Amount</label>
                    <input
                      type="number"
                      id="loan_amount"
                      name="loan_amount"
                      value={formData.loan_amount}
                      onChange={handleInputChange}
                      min="1"
                      step="0.01"
                      required
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="interest">Interest Rate</label>
                    <div className="input-group">
                      <input
                        type="number"
                        id="interest"
                        name="interest"
                        value={formData.interest}
                        onChange={handleInputChange}
                        min="0"
                        max="1"
                        step="0.001"
                        required
                        className="form-input"
                      />
                      <span className="input-suffix">{(formData.interest * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="months">Repayment Period (Months)</label>
                    <input
                      type="number"
                      id="months"
                      name="months"
                      value={formData.months}
                      onChange={handleInputChange}
                      min="1"
                      required
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="loan_start">Loan Start Date</label>
                    <input
                      type="date"
                      id="loan_start"
                      name="loan_start"
                      value={formData.loan_start}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="loan_end">Loan End Date</label>
                    <input
                      type="date"
                      id="loan_end"
                      name="loan_end"
                      value={formData.loan_end}
                      className="form-input"
                      readOnly
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="transaction_date">Transaction Date</label>
                    <input
                      type="date"
                      id="transaction_date"
                      name="transaction_date"
                      value={formData.transaction_date}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="service">Service Fee</label>
                    <input
                      type="number"
                      id="service"
                      name="service"
                      value={formData.service}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="adjustment">Adjustment</label>
                    <input
                      type="number"
                      id="adjustment"
                      name="adjustment"
                      value={formData.adjustment}
                      onChange={handleInputChange}
                      step="0.01"
                      className="form-input"
                    />
                  </div>
                </div>
                
                <div className="calculated-values">
                  <div className="calc-group">
                    <label>Gross Receivable:</label>
                    <span>{formatCurrency(formData.gross_receivable)}</span>
                  </div>
                  
                  <div className="calc-group">
                    <label>Monthly Payment:</label>
                    <span>{formatCurrency(formData.payday_payment)}</span>
                  </div>
                  
                  <div className="calc-group highlight">
                    <label>Overall Balance:</label>
                    <span>{formatCurrency(formData.overall_balance)}</span>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button type="submit" className="btn btn-success">
                    {isEditMode ? "Update Loan" : "Create Loan"}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Loan Details Modal */}
      {isDetailsModalOpen && selectedLoan && (
  <div className="modal-overlay">
    <div className="modal-container details-modal">
      <div className="modal-header">
        <h2>Loan Details</h2>
        <button className="close-btn" onClick={() => setIsDetailsModalOpen(false)}>×</button>
      </div>
      
      <div className="modal-body">
        {/* Tabs Navigation */}
        <div className="tabs">
          <div 
            className={`tab ${activeTab === 'info' ? 'active' : ''}`} 
            onClick={() => setActiveTab('info')}
          >
            Loan Information
          </div>
          <div 
            className={`tab ${activeTab === 'schedule' ? 'active' : ''}`} 
            onClick={() => setActiveTab('schedule')}
          >
            Payment Schedule
          </div>
        </div>
        
        {/* Tab Content - Loan Information */}
        <div className={`tab-content ${activeTab === 'info' ? 'active' : ''}`} id="info-tab">
          <div className="loan-summary">
            <div className="loan-amount-display">
              <div className="amount-value">{formatCurrency(selectedLoan.loan_amount)}</div>
              <div className="amount-label">Loan Amount</div>
            </div>
            <div className="loan-status-info">
              <div className="status-badge status-active">Active</div>
              <div className="loan-period">
                {formatDate(selectedLoan.loan_start)} - {formatDate(selectedLoan.loan_end)}
              </div>
            </div>
          </div>
          
          <div className="detail-section">
            <h3>Loan Details</h3>
            <div className="detail-grid three-columns">
              <div className="detail-item">
                <label>Loan ID</label>
                <span>{selectedLoan.loan_id}</span>
              </div>
              <div className="detail-item">
                <label>Customer</label>
                <span>{selectedLoan.first_name} {selectedLoan.last_name}</span>
              </div>
              <div className="detail-item">
                <label>Transaction Date</label>
                <span>{formatDate(selectedLoan.transaction_date)}</span>
              </div>
              <div className="detail-item">
                <label>Interest Rate</label>
                <span>{(selectedLoan.interest * 100).toFixed(2)}%</span>
              </div>
              <div className="detail-item">
                <label>Service Fee</label>
                <span>{formatCurrency(selectedLoan.service)}</span>
              </div>
              <div className="detail-item">
                <label>Monthly Payment</label>
                <span>{formatCurrency(selectedLoan.payday_payment)}</span>
              </div>
            </div>
          </div>
          
          <div className="detail-section balance-section">
            <h3>Balance Information</h3>
            <div className="balance-cards">
              <div className="balance-card">
                <div className="balance-amount">{formatCurrency(selectedLoan.balance)}</div>
                <div className="balance-label">Current Balance</div>
                <div className="progress-bar">
                  <div 
                    className="progress" 
                    style={{width: `${(1-(selectedLoan.balance/selectedLoan.gross_receivable))*100}%`}}
                  ></div>
                </div>
              </div>
              <div className="balance-card">
                <div className="balance-amount">{formatCurrency(selectedLoan.overall_balance)}</div>
                <div className="balance-label">Overall Balance</div>
              </div>
              <div className="balance-card">
                <div className="balance-amount">{formatCurrency(selectedLoan.gross_receivable)}</div>
                <div className="balance-label">Gross Receivable</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tab Content - Payment Schedule */}
        <div className={`tab-content ${activeTab === 'schedule' ? 'active' : ''}`} id="schedule-tab">
          <div className="detail-section payment-schedule-section">
            <h3>Payment Schedule</h3>
            {receipts.length > 0 ? (
              <div className="receipt-table-container">
                <table className="receipt-table">
                  <thead>
                    <tr>
                      <th>Receipt ID</th>
                      <th>Due Date</th>
                      <th>Required Amount</th>
                      <th>Payment Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map((receipt) => (
                      <tr key={receipt.pay_id} className={`receipt-row ${getReceiptStatusClass(receipt)}`}>
                        <td>{receipt.pay_id}</td>
                        <td>
                          {new Date(receipt.schedule).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </td>
                        <td>{formatCurrency(receipt.to_pay)}</td>
                        <td>{formatCurrency(receipt.amount)}</td>
                        <td>
                          {receipt.amount >= receipt.to_pay ? (
                            <span className="status paid">Paid</span>
                          ) : receipt.amount > 0 ? (
                            <span className="status partial">Partial</span>
                          ) : (
                            <span className="status unpaid">Unpaid</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-data-message">
                <p>No payment schedule available for this loan.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={() => setIsDetailsModalOpen(false)}>Close</button>
        <button className="btn btn-primary">Make Payment</button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default Lending;
