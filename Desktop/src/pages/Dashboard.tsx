import React, { useState, useEffect } from 'react';
import { Home, Users, DollarSign, Bell, Menu, X } from 'lucide-react';

import Customer from './Dashboard/Customer';
import LendingPage from './Dashboard/Lending';

type PageType = "home" | "customer" | "lending";

interface NavItem {
  id: PageType;
  label: string;
  icon: JSX.Element;
}

const Dashboard: React.FC = () => {
  const getInitialPage = (): PageType => {
    if (typeof window !== 'undefined') {
      const savedPage = localStorage.getItem('activePage');
      if (savedPage === 'home' || savedPage === 'customer' || savedPage === 'lending') {
        return savedPage;
      }
    }
    return "home";
  };

  const [activePage, setActivePage] = useState<PageType>(getInitialPage());
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<number>(3);

  const navItems: NavItem[] = [
    { id: "home", label: "Dashboard", icon: <Home size={20} /> },
    { id: "customer", label: "Customers", icon: <Users size={20} /> },
    { id: "lending", label: "Lending", icon: <DollarSign size={20} /> }
  ];

  useEffect(() => {
    localStorage.setItem('activePage', activePage);
  }, [activePage]);

  const handleNavChange = (pageId: PageType) => {
    setNotifications(1)
    setActivePage(pageId);
    if (isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
  };

  const renderPageContent = () => {
    switch (activePage) {
      case "customer":
        return <Customer />;
      case "home":
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-medium text-gray-800 mb-4">
              Welcome to your Dashboard
            </h3>
            <p className="text-gray-600">
              This is your main dashboard where you can view key metrics and reports.
            </p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="bg-gray-50 p-4 rounded border border-gray-200">
                  <h4 className="font-medium text-gray-700">Content Panel {item}</h4>
                  <p className="text-sm text-gray-500 mt-2">
                    This is a placeholder for the dashboard content.
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      case "lending":
        return (
          <>
          <LendingPage />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-20 md:hidden" 
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30
        w-64 transform transition-transform duration-300 ease-in-out
        bg-white shadow-lg md:shadow-md flex flex-col
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b">
          <h1 className="text-xl font-bold text-gray-800">Company Name</h1>
          <button 
            className="md:hidden" 
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <X size={24} className="text-gray-600 hover:text-gray-900" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 pt-4 pb-4 overflow-y-auto">
          <ul>
            {navItems.map((item) => (
              <li key={item.id} className="px-2 py-1">
                <button
                  onClick={() => handleNavChange(item.id)}
                  className={`
                    flex items-center w-full px-4 py-3 rounded-md 
                    transition-colors duration-200 text-left
                    ${activePage === item.id 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'}
                  `}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                  {item.id === "customer" && notifications > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {notifications}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="border-t px-6 py-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
              JS
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-800">John Smith</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6">
          <div className="flex items-center">
            <button 
              className="md:hidden mr-4" 
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu size={24} className="text-gray-600 hover:text-gray-900" />
            </button>
            <h2 className="text-lg font-medium text-gray-800">
              {navItems.find(item => item.id === activePage)?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center">
            <button className="relative p-2 text-gray-600 hover:text-gray-900">
              <Bell size={20} />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {renderPageContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;