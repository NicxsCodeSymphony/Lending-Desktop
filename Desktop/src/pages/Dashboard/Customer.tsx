import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Filter, User, Calendar, Clock, MapPin, Mail, Phone } from 'lucide-react';
import { fetchCustomers } from '../../../utils/lib/CustomerServer';
import { Customer } from '../../../utils/lib/Customer';

import AddCustomerModal from '../../../components/Modal/AddCustomer';
import ViewCustomerDetails from '../../../components/ViewCustomer';
import EditCustomerModal from '../../../components/Modal/EditCustomer';

const CustomerPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddCustomer, setIsAddCustomer] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<{field: string; direction: 'asc' | 'desc'}>({
    field: 'created_at',
    direction: 'desc'
  });

  // Fetch customers from API
  const fetchAllCustomers = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await fetchCustomers();
      setCustomers(data);
      setError(null);
    } catch (err) {
      setError('Failed to load customers. Please try again later.');
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCustomers();
  }, []);

  const handleSort = (field: string): void => {
    setSortBy(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedCustomers = [...customers].sort((a, b) => {
    const field = sortBy.field;
    const direction = sortBy.direction === 'asc' ? 1 : -1;
    
    if (field === 'name') {
      const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
      const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
      return nameA.localeCompare(nameB) * direction;
    }
    
    if (field === 'created_at' || field === 'birthdate') {
      const dateA = new Date(a[field]).getTime();
      const dateB = new Date(b[field]).getTime();
      return (dateA - dateB) * direction;
    }
    
    if (field === 'status') {
      return a.status.localeCompare(b.status) * direction;
    }
    
    return 0;
  });

  const filteredCustomers = sortedCustomers.filter(customer => {
    const fullName = `${customer.first_name} ${customer.middle_name || ''} ${customer.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                          customer.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'Active' && customer.status === 'Active') ||
                         (filterStatus === 'Inactive' && customer.status === 'Inactive');
    return matchesSearch && matchesFilter;
  });

  const itemsPerPage = 6;
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleViewDetails = (customer: Customer): void => {
    setSelectedCustomer(customer);
    setShowDetails(true);
    setShowEditModal(false);
  };

  const handleEditCustomer = (customer: Customer): void => {
    setSelectedCustomer(customer);
    setShowEditModal(true);
  };

  const handleDeleteCustomer = (customerId: string): void => {
    // Implement delete confirmation and functionality
    if (window.confirm('Are you sure you want to delete this customer?')) {
      // Delete logic would go here
      console.log(`Deleting customer with ID: ${customerId}`);
      // Then refresh customer list
      fetchAllCustomers();
    }
  };

  const handleBackToList = (): void => {
    setShowDetails(false);
    setShowEditModal(false);
    setSelectedCustomer(null);
  };

  const handlePageChange = (page: number): void => {
    setCurrentPage(page);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusDot = (status: string): string => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-500';
      case 'Inactive':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getInitials = (customer: Customer): string => {
    return `${customer.first_name[0]}${customer.last_name[0]}`;
  };

  const getFullName = (customer: Customer): string => {
    return `${customer.first_name} ${customer.middle_name ? customer.middle_name + ' ' : ''}${customer.last_name}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Custom SortIcon component
  const SortIcon: React.FC<{field: string}> = ({ field }) => {
    if (sortBy.field !== field) {
      return <div className="w-4 h-4 opacity-0 group-hover:opacity-50"></div>;
    }
    
    return sortBy.direction === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Custom ViewCustomerDetailsComponent
  const ModernViewCustomerDetails: React.FC<{
    customer: Customer;
    onBack: () => void;
    onEdit: () => void;
  }> = ({ customer, onBack, onEdit }) => {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-white mb-6 hover:bg-white hover:bg-opacity-20 rounded-md px-3 py-1 transition-all"
          >
            <ChevronLeft size={18} />
            <span>Back to customers</span>
          </button>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold text-2xl">
              {getInitials(customer)}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{getFullName(customer)}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`h-2 w-2 rounded-full ${getStatusDot(customer.status)}`}></span>
                <span className="text-white text-opacity-90">{customer.status}</span>
              </div>
            </div>
            <div className="ml-auto mt-4 md:mt-0">
              <button 
                onClick={onEdit}
                className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                <Edit2 size={16} />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User size={20} className="text-gray-400 mt-1" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">Full Name</div>
                    <div className="text-gray-900">{getFullName(customer)}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar size={20} className="text-gray-400 mt-1" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">Birthdate</div>
                    <div className="text-gray-900">{formatDate(customer.birthdate)}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin size={20} className="text-gray-400 mt-1" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">Address</div>
                    <div className="text-gray-900">{customer.address}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail size={20} className="text-gray-400 mt-1" />
                  
                </div>
                <div className="flex items-start gap-3">
                  <Phone size={20} className="text-gray-400 mt-1" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">Phone Number</div>
                    <div className="text-gray-900">{customer.contact || 'Not provided'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock size={20} className="text-gray-400 mt-1" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">Created</div>
                    <div className="text-gray-900">{formatDate(customer.created_at)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (showDetails && selectedCustomer) {
    return (
      <ViewCustomerDetails 
        customer={selectedCustomer} 
        onBack={handleBackToList}
        onEdit={() => handleEditCustomer(selectedCustomer)}
        getInitials={getInitials}
        getFullName={getFullName}
        formatDate={formatDate}
        getStatusColor={getStatusColor}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Customer Management</h1>
        <p className="text-gray-500">View, search and manage your customer database</p>
      </div>

      {/* Search and filter bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or address..."
            className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="relative">
            <select
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 h-full shadow-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <Filter size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button 
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            onClick={() => setIsAddCustomer(true)}
          >
            <Plus size={16} />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="text-sm font-medium text-gray-500">Total Customers</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{customers.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="text-sm font-medium text-gray-500">Active Customers</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {customers.filter(c => c.status === 'Active').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="text-sm font-medium text-gray-500">Inactive Customers</div>
          <div className="text-2xl font-bold text-gray-600 mt-1">
            {customers.filter(c => c.status === 'Inactive').length}
          </div>
        </div>
      </div>

      {/* Customer table */}
      <div className="flex-grow overflow-hidden bg-white rounded-xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading customers...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500 bg-red-50 px-4 py-3 rounded-lg flex items-center">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Customer <SortIcon field="name" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Status <SortIcon field="status" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
                    onClick={() => handleSort('birthdate')}
                  >
                    <div className="flex items-center gap-2">
                      Birthdate <SortIcon field="birthdate" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-2">
                      Created <SortIcon field="created_at" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {paginatedCustomers.map((customer) => (
                  <tr key={customer.customer_id} className="transition-colors hover:bg-blue-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium shadow-sm">
                          {getInitials(customer)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer" onClick={() => handleViewDetails(customer)}>
                            {getFullName(customer)}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin size={12} className="text-gray-400" />
                            {customer.address}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${getStatusColor(customer.status)}`}>
                          <span className={`w-2 h-2 rounded-full ${getStatusDot(customer.status)} mr-1 inline-block my-auto`}></span>
                          {customer.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-700">{formatDate(customer.birthdate)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-700">{formatDate(customer.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <button 
                          onClick={() => handleViewDetails(customer)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => handleEditCustomer(customer)} 
                          className="text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        {/* <button 
                          onClick={() => handleDeleteCustomer(customer.customer_id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button> */}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedCustomers.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <p className="mt-2 text-lg font-medium text-gray-500">No customers found</p>
                        <p className="text-sm text-gray-400 mt-1">Try changing your search or filter criteria</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredCustomers.length > 0 && (
        <div className="mt-6 flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredCustomers.length)}</span> of <span className="font-medium">{filteredCustomers.length}</span> customers
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`inline-flex items-center px-3 py-1 border rounded-md text-sm transition-colors ${
                currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
            >
              <ChevronLeft size={16} />
            </button>
            
            {/* Dynamic pagination - show at most 5 pages */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
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
                  onClick={() => handlePageChange(pageNum)}
                  className={`inline-flex items-center px-3 py-1 border rounded-md text-sm transition-colors ${
                    currentPage === pageNum ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`inline-flex items-center px-3 py-1 border rounded-md text-sm transition-colors ${
                currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddCustomerModal isOpen={isAddCustomer} onClose={() => setIsAddCustomer(false)} />
      
      {showEditModal && selectedCustomer && (
        <EditCustomerModal 
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          customer={selectedCustomer}
        />
      )}
    </div>
  );
};

export default CustomerPage;