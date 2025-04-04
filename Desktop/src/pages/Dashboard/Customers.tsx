import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash, 
  Eye, 
  X, 
  CheckCircle, 
  ArrowDownUp, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Download,
  AlertCircle,
  ChevronDown
} from "lucide-react";

import '../../styles/Customer.css'

interface Customer {
  customer_id: number;
  first_name: string;
  middle_name: string;
  last_name: string;
  address: string;
  birthdate: string;
  status: "Active" | "Inactive";
  created_at: string;
  updated_at: string;
}

// Initial form state for new/edit customer
const initialFormState: Omit<Customer, "customer_id" | "created_at" | "updated_at"> = {
  first_name: "",
  middle_name: "",
  last_name: "",
  address: "",
  birthdate: "",
  status: "Active"
};

// API base URL
const API_URL = "http://localhost:3002";

const Customers: React.FC = () => {
  // State management
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "delete" | "view">("create");
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<typeof initialFormState>({...initialFormState});
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  
  // Sorting states
  const [sortField, setSortField] = useState<keyof Customer>("customer_id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // Refs
  const modalRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  
  // Fetch customers data with Axios
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await axios.get<Customer[]>(`${API_URL}/customers`);
      setCustomers(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError("Failed to fetch customers. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  
  // Initialize data
  useEffect(() => {
    fetchCustomers();
    
    // Click outside listeners
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        closeModal();
      }
      
      if (filterRef.current && !filterRef.current.contains(event.target as Node) && showFilters) {
        setShowFilters(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilters]);
  
  // Apply filters, sorting, and pagination
  useEffect(() => {
    let results = [...customers];
    
    // Apply search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      results = results.filter(customer => 
        customer.first_name.toLowerCase().includes(search) || 
        customer.last_name.toLowerCase().includes(search) || 
        customer.address.toLowerCase().includes(search)
      );
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      results = results.filter(customer => customer.status.toLowerCase() === statusFilter.toLowerCase());
    }
    
    // Apply sorting
    results.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredCustomers(results);
    setTotalPages(Math.ceil(results.length / itemsPerPage));
    
    // Reset to first page when filters change
    if (currentPage > Math.ceil(results.length / itemsPerPage)) {
      setCurrentPage(1);
    }
  }, [customers, searchTerm, statusFilter, sortField, sortDirection, itemsPerPage]);
  
  // Handle sorting
  const handleSort = (field: keyof Customer) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Modal handlers
  const openModal = (mode: "create" | "edit" | "delete" | "view", customer?: Customer) => {
    setModalMode(mode);
    
    if (customer && (mode === "edit" || mode === "delete" || mode === "view")) {
      setCurrentCustomer(customer);
      setFormData({
        first_name: customer.first_name,
        middle_name: customer.middle_name,
        last_name: customer.last_name,
        address: customer.address,
        birthdate: customer.birthdate,
        status: customer.status
      });
    } else {
      setCurrentCustomer(null);
      setFormData({...initialFormState});
    }
    
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCustomer(null);
    setFormData({...initialFormState});
  };
  
  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // CRUD operations with Axios
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.first_name || !formData.last_name || !formData.address || !formData.birthdate) {
      alert("Please fill in all required fields");
      return;
    }
    
    try {
      if (modalMode === "create") {
        // In real app, use axios.post
        const response = await axios.post(`${API_URL}/customers`, formData);
        // setCustomers(prev => [...prev, response.data]);
        
        // Simulated create
        const newCustomer: Customer = {
          customer_id: Math.max(...customers.map(c => c.customer_id), 0) + 1,
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setCustomers(prev => [...prev, newCustomer]);
        
      } else if (modalMode === "edit" && currentCustomer) {
        // In real app, use axios.put
        const response = await axios.put(`${API_URL}/customers/${currentCustomer.customer_id}`, formData);
        
        // Simulated update
        const updatedCustomers = customers.map(customer => 
          customer.customer_id === currentCustomer.customer_id
            ? { 
                ...customer, 
                ...formData,
                updated_at: new Date().toISOString() 
              }
            : customer
        );
        
        setCustomers(updatedCustomers);
      }
      
      closeModal();
      
    } catch (err) {
      setError(`Operation failed. Please try again.`);
    }
  };
  
  const handleDeleteCustomer = async () => {
    if (!currentCustomer) return;
    
    try {
      // In real app, use axios.delete
      await axios.delete(`${API_URL}/customers/${currentCustomer.customer_id}`);
      
      // Simulated delete
      const updatedCustomers = customers.filter(
        customer => customer.customer_id !== currentCustomer.customer_id
      );
      
      setCustomers(updatedCustomers);
      closeModal();
      
    } catch (err) {
      setError(`Failed to delete customer.`);
    }
  };
  
  // Get current page data
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(startIndex, startIndex + itemsPerPage);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      // For birthdate format
      if (!dateString.includes('T')) {
        return dateString;
      }
      
      // For ISO dates
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date);
    } catch (err) {
      return dateString;
    }
  };
  
  // Export customers data as CSV
  const exportCSV = () => {
    const headers = ["ID", "First Name", "Middle Name", "Last Name", "Address", "Birthdate", "Status"];
    const csvRows = [
      headers.join(','), 
      ...filteredCustomers.map(customer => [
        customer.customer_id,
        `"${customer.first_name}"`,
        `"${customer.middle_name}"`,
        `"${customer.last_name}"`,
        `"${customer.address}"`,
        `"${customer.birthdate}"`,
        customer.status
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };
  
  return (
    <div className="w-full max-w-screen-xl mx-auto p-6 bg-white dark:bg-gray-900 shadow-sm rounded-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-4 sm:mb-0">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 mr-3">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Customers</h1>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => fetchCustomers()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          
          <button 
            onClick={exportCSV}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          
          <button 
            onClick={() => openModal("create")}
            className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </button>
        </div>
      </div>
      
      {/* Alert */}
      {error && (
        <div className="mb-4 p-4 rounded-md bg-red-50 dark:bg-red-900/20 flex items-center border border-red-100 dark:border-red-800">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-800 dark:text-red-300">{error}</span>
        </div>
      )}
      
      {/* Search and filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
            </button>
          )}
        </div>
        
        <div className="flex gap-2 items-center">
          <div className="relative" ref={filterRef}>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              <ChevronDown className="h-4 w-4 ml-1" />
            </button>
            
            {showFilters && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10 p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="deleted">Deleted</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Items per page
                  </label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          
          {statusFilter !== "all" && (
            <div className="flex items-center rounded-full px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
              Status: {statusFilter}
              <button 
                onClick={() => setStatusFilter("all")}
                className="ml-1 text-blue-500 hover:text-blue-700"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("customer_id")}
              >
                <div className="flex items-center">
                  ID
                  {sortField === "customer_id" && (
                    <ArrowDownUp className={`h-3 w-3 ml-1 ${sortDirection === "asc" ? "text-blue-500" : "text-blue-500 transform rotate-180"}`} />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("first_name")}
              >
                <div className="flex items-center">
                  First Name
                  {sortField === "first_name" && (
                    <ArrowDownUp className={`h-3 w-3 ml-1 ${sortDirection === "asc" ? "text-blue-500" : "text-blue-500 transform rotate-180"}`} />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("last_name")}
              >
                <div className="flex items-center">
                  Last Name
                  {sortField === "last_name" && (
                    <ArrowDownUp className={`h-3 w-3 ml-1 ${sortDirection === "asc" ? "text-blue-500" : "text-blue-500 transform rotate-180"}`} />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell"
              >
                Address
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hidden sm:table-cell"
                onClick={() => handleSort("birthdate")}
              >
                <div className="flex items-center">
                  Birthdate
                  {sortField === "birthdate" && (
                    <ArrowDownUp className={`h-3 w-3 ml-1 ${sortDirection === "asc" ? "text-blue-500" : "text-blue-500 transform rotate-180"}`} />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center">
                  Status
                  {sortField === "status" && (
                    <ArrowDownUp className={`h-3 w-3 ml-1 ${sortDirection === "asc" ? "text-blue-500" : "text-blue-500 transform rotate-180"}`} />
                  )}
                </div>
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                    <p className="text-gray-500 dark:text-gray-400">Loading customers...</p>
                  </div>
                </td>
              </tr>
            ) : getCurrentPageData().length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-2" />
                    <h3 className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-1">No customers found</h3>
                    <p className="text-gray-400 dark:text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
                  </div>
                </td>
              </tr>
            ) : (
              getCurrentPageData().map(customer => (
                <tr 
                  key={customer.customer_id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {customer.customer_id}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {customer.first_name}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {customer.last_name}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell max-w-xs truncate">
                    {customer.address}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                    {formatDate(customer.birthdate)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span 
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        customer.status === "Active" 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
                          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                      }`}
                    >
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openModal("view", customer)}
                        className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openModal("edit", customer)}
                        className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
                        title="Edit Customer"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openModal("delete", customer)}
                        className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
                        title="Delete Customer"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 mt-4">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 sm:mb-0">
          Showing {filteredCustomers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {
            Math.min(currentPage * itemsPerPage, filteredCustomers.length)
          } of {filteredCustomers.length} customers
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className={`px-2 py-1 text-xs rounded-md ${
              currentPage === 1 
                ? "text-gray-400 cursor-not-allowed" 
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            First
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`p-1 rounded-md ${
              currentPage === 1 
                ? "text-gray-400 cursor-not-allowed" 
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          {/* Page numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            // Page numbers logic calculation continued
        } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }
          
          return (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`px-3 py-1 text-sm rounded-md ${
                currentPage === pageNum
                  ? "bg-blue-600 text-white" 
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              {pageNum}
            </button>
          );
        })}
        
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className={`p-1 rounded-md ${
            currentPage === totalPages 
              ? "text-gray-400 cursor-not-allowed" 
              : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          }`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          className={`px-2 py-1 text-xs rounded-md ${
            currentPage === totalPages 
              ? "text-gray-400 cursor-not-allowed" 
              : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          }`}
        >
          Last
        </button>
      </div>
    </div>
    
    {/* Modal */}
{isModalOpen && (
  <div className="modal-overlay">
    <div 
      ref={modalRef}
      className={`modal-container ${
        modalMode === "create" ? "modal-create" : 
        modalMode === "edit" ? "modal-edit" : 
        modalMode === "delete" ? "modal-delete" : 
        "modal-view"
      }`}
    >
      {modalMode === "view" && currentCustomer && (
        <>
          <div className="modal-header">
            <h2 className="modal-title">
              Customer Details
            </h2>
            <button 
              onClick={closeModal}
              className="modal-close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="modal-content">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="detail-label">ID</p>
                <p className="detail-value">{currentCustomer.customer_id}</p>
              </div>
              <div>
                <p className="detail-label">Status</p>
                <span 
                  className={`badge ${
                    currentCustomer.status === "Active" 
                      ? "badge-success" 
                      : "badge-danger"
                  }`}
                >
                  {currentCustomer.status}
                </span>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="detail-label">Full Name</p>
              <p className="detail-value">
                {currentCustomer.first_name} {currentCustomer.middle_name} {currentCustomer.last_name}
              </p>
            </div>
            
            <div className="mb-4">
              <p className="detail-label">Address</p>
              <p className="detail-value">{currentCustomer.address}</p>
            </div>
            
            <div className="mb-4">
              <p className="detail-label">Birthdate</p>
              <p className="detail-value">{formatDate(currentCustomer.birthdate)}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="detail-label">Created</p>
                <p className="detail-value">{formatDate(currentCustomer.created_at)}</p>
              </div>
              <div>
                <p className="detail-label">Last Updated</p>
                <p className="detail-value">{formatDate(currentCustomer.updated_at)}</p>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button
              onClick={closeModal}
              className="btn btn-secondary"
            >
              Close
            </button>
            <button
              onClick={() => {
                closeModal();
                openModal("edit", currentCustomer);
              }}
              className="btn btn-primary"
            >
              Edit
            </button>
          </div>
        </>
      )}
      
      {(modalMode === "create" || modalMode === "edit") && (
        <>
          <div className="modal-header">
            <h2 className="modal-title">
              {modalMode === "create" ? "Add New Customer" : "Edit Customer"}
            </h2>
            <button 
              onClick={closeModal}
              className="modal-close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleFormSubmit} className="modal-content">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1 form-group">
                <label className="form-label required-field">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              
              <div className="col-span-2 sm:col-span-1 form-group">
                <label className="form-label">
                  Middle Name
                </label>
                <input
                  type="text"
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              
              <div className="col-span-2 sm:col-span-1 form-group">
                <label className="form-label required-field">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              
              <div className="col-span-2 form-group">
                <label className="form-label required-field">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  rows={2}
                  className="form-input"
                />
              </div>
              
              <div className="col-span-2 form-group">
                <label className="form-label required-field">
                  Birthdate
                </label>
                <input
                  type="text"
                  name="birthdate"
                  value={formData.birthdate}
                  onChange={handleInputChange}
                  placeholder="e.g. January 1, 2000"
                  required
                  className="form-input"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                type="button"
                onClick={closeModal}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                {modalMode === "create" ? "Create" : "Update"}
              </button>
            </div>
          </form>
        </>
      )}
      
      {modalMode === "delete" && currentCustomer && (
        <>
          <div className="modal-header">
            <h2 className="modal-title">
              Delete Customer
            </h2>
            <button 
              onClick={closeModal}
              className="modal-close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="modal-content">
            <div className="alert alert-danger">
              <div className="alert-icon">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="alert-content">
                <h3 className="alert-title">
                  Warning
                </h3>
                <p className="alert-message">
                  Are you sure you want to delete this customer? This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="detail-label">Customer ID</p>
              <p className="detail-value">{currentCustomer.customer_id}</p>
            </div>
            
            <div className="mb-4">
              <p className="detail-label">Name</p>
              <p className="detail-value">
                {currentCustomer.first_name} {currentCustomer.middle_name} {currentCustomer.last_name}
              </p>
            </div>
          </div>
          
          <div className="modal-footer">
            <button
              onClick={closeModal}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteCustomer}
              className="btn btn-danger"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  </div>
)}
    
  </div>
);
};

export default Customers;