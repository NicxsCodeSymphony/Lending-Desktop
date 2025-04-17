import React, { useState } from 'react';
import { ChevronLeft, Calendar, MapPin, Cake, AlertCircle } from 'lucide-react';
import { Customer } from '../utils/lib/Customer';

import EditCustomerModal from './Modal/EditCustomer';

interface ViewCustomerDetailsProps {
  customer: Customer;
  onBack: () => void;
  onEdit: () => void;
  getInitials: (customer: Customer) => string;
  getFullName: (customer: Customer) => string;
  formatDate: (dateString: string) => string;
  getStatusColor: (status: string) => string;
}

const ViewCustomerDetails: React.FC<ViewCustomerDetailsProps> = ({
  customer,
  onBack,
  onEdit,
  getInitials,
  getFullName,
  formatDate,
  getStatusColor
}) => {
  // Calculate age
  const birthDate = new Date(customer.birthdate);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
    ? age - 1 
    : age;

  // Calculate days until next birthday
  const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  if (nextBirthday < today) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }
  const daysUntilBirthday = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Get zodiac sign
  const getZodiacSign = (date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn";
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
    return "Pisces";
  };

  const [isEditModal, setIsEditModal] = useState<boolean>(false)

  return (
    <div className="h-full flex flex-col bg-gray-50 p-6">
      <div className="mb-6">
        <button 
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ChevronLeft size={20} className="mr-1" />
          Back to Customers
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg p-8 flex-grow">
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-medium shadow-lg">
              {getInitials(customer)}
            </div>
            <div className="ml-6">
              <h3 className="text-3xl font-bold text-gray-900">{getFullName(customer)}</h3>
              <div className="flex items-center mt-2 text-gray-600">
                <MapPin size={16} className="mr-2" />
                <p>{customer.address}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className={`px-4 py-2 text-sm font-semibold rounded-full ${getStatusColor(customer.status)} shadow-sm`}>
              {customer.status}
            </span>
            <p className="text-sm text-gray-500 mt-2">
              Customer since {new Date(customer.created_at).toLocaleDateString('en-US', { 
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center mb-4">
              <Cake className="w-8 h-8 text-blue-600 mr-3" />
              <h4 className="text-xl font-semibold text-gray-900">Birthday</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              {new Date(customer.birthdate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
            <p className="text-gray-600">
              {daysUntilBirthday === 0 
                ? "🎉 Happy Birthday!" 
                : `${daysUntilBirthday} days until next birthday`}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center mb-4">
              <Calendar className="w-8 h-8 text-purple-600 mr-3" />
              <h4 className="text-xl font-semibold text-gray-900">Age</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-2">{actualAge} years old</p>
            <p className="text-gray-600">Born in {birthDate.getFullYear()}</p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">✨</span>
              <h4 className="text-xl font-semibold text-gray-900">Zodiac Sign</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-2">{getZodiacSign(birthDate)}</p>
            <p className="text-gray-600">Western Astrology</p>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xl font-semibold text-gray-900 flex items-center">
              <AlertCircle size={20} className="mr-2 text-blue-600" />
              Loan Information
            </h4>
          </div>
          <div className="flex items-center justify-center p-8 text-gray-500">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-600 mb-2">No loan information available</p>
              <p className="text-sm text-gray-500">This customer hasn't taken any loans yet</p>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-4">
          <button 
            onClick={() => setIsEditModal(true)}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 font-medium"
          >
            Edit Customer
          </button>
          <button className="flex-1 bg-white border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 font-medium">
            Add New Loan
          </button>
          <button className="flex-1 bg-white border-2 border-red-500 text-red-500 px-6 py-3 rounded-lg hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 font-medium">
            Delete Customer
          </button>
        </div>
      </div>

      {isEditModal && (
        <EditCustomerModal
          isOpen={isEditModal}
          onClose={() => setIsEditModal(false)}
          customer={customer}
        />
      )}
    </div>
  );
};

export default ViewCustomerDetails;