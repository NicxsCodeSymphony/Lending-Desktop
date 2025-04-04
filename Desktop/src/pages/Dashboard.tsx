import { useEffect, useState } from "react";
import { 
  Home, 
  BarChart2, 
  Settings, 
  User, 
  Bell, 
  Search, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight,
  User2
} from "lucide-react";

type PageType = "home" | "customer" | "lending" | "profile";

interface NavItem {
  id: PageType;
  label: string;
  icon: JSX.Element;
}

import '../styles/Dashboard.css'
import Customers from "./Dashboard/Customers";
import Lending from "./Dashboard/Lending";

const Dashboard: React.FC = () => {
  const [activePage, setActivePage] = useState<PageType>("home");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<number>(3);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  useEffect(() => {
    const user = localStorage.getItem("authToken");
    if (!user) {
      window.location.href = "/";
    }
    
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDarkMode);
    
    if (savedDarkMode) {
      document.body.classList.add("dark-mode");
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));
    
    if (newMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  };

  const navItems: NavItem[] = [
    { id: "home", label: "Dashboard", icon: <Home size={20} /> },
    { id: "customer", label: "Customer", icon: <User2 size={20} /> },
    { id: "lending", label: "Lending", icon: <Settings size={20} /> },
    { id: "profile", label: "My Profile", icon: <User size={20} /> },
  ];

  const renderPage = () => {
    switch (activePage) {
      case "home":
        return <HomePage />;
      case "customer":
        return <Customers title="Customer" />;
      case "lending":
        return <Lending title="Lending" />;
      case "profile":
        return <PlaceholderPage title="Profile" />;
      default:
        return <HomePage />;
    }
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className={`dashboard-container ${darkMode ? 'dark-mode' : ''}`}>
      {/* Sidebar */}
      <aside className={`sidebar ${isMobileSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </div>
            <h2>Pulse</h2>
          </div>
          <button className="close-sidebar" onClick={toggleMobileSidebar}>
            <X size={20} />
          </button>
        </div>
        
        <div className="sidebar-user">
          <div className="avatar">JD</div>
          <div className="user-info">
            <h4>John Doe</h4>
            <p>Admin</p>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            {navItems.map((item) => (
              <li 
                key={item.id}
                className={activePage === item.id ? "active" : ""}
                onClick={() => {
                  setActivePage(item.id);
                  if (window.innerWidth < 768) setIsMobileSidebarOpen(false);
                }}
              >
                <div className="nav-item">
                  <span className="icon">{item.icon}</span>
                  <span className="label">{item.label}</span>
                </div>
                <ChevronRight size={16} className="chevron" />
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="theme-toggle">
            <label className="switch">
              <input 
                type="checkbox" 
                checked={darkMode} 
                onChange={toggleDarkMode}
              />
              <span className="slider round"></span>
            </label>
            <span>Dark Mode</span>
          </div>
          <button 
            className="logout-button"
            onClick={() => {
              localStorage.removeItem("authToken");
              window.location.href = "/";
            }}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-area">
        {/* Top Navigation */}
        <header className="top-nav">
          <div className="mobile-toggle">
            <button onClick={toggleMobileSidebar}>
              <Menu size={24} />
            </button>
            <h2>{navItems.find(item => item.id === activePage)?.label}</h2>
          </div>
          
          <div className="search-container">
            <Search size={18} />
            <input type="text" placeholder="Search..." />
          </div>
          
          <div className="top-nav-actions">
            <button className="notification-btn">
              <Bell size={20} />
              {notifications > 0 && <span className="badge">{notifications}</span>}
            </button>
            <div className="user-menu">
              <div className="avatar mobile-hidden">JD</div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          {renderPage()}
        </div>
      </main>

      {/* Overlay for mobile */}
      {isMobileSidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsMobileSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

// Placeholder Home page with content
const HomePage: React.FC = () => {
  const stats = [
    { label: "Total Users", value: "2,845", trend: "+12.5%", up: true },
    { label: "Revenue", value: "$12,875", trend: "+8.3%", up: true },
    { label: "Conversion", value: "3.7%", trend: "-2.4%", up: false },
    { label: "Avg. Session", value: "4m 32s", trend: "+18.2%", up: true },
  ];

  const recentActivities = [
    { user: "Sofia Lee", action: "created a new campaign", time: "5 min ago" },
    { user: "Alex Johnson", action: "updated analytics report", time: "2 hours ago" },
    { user: "Maria Garcia", action: "completed onboarding", time: "Yesterday" },
    { user: "Robert Chen", action: "posted a comment", time: "2 days ago" },
  ];

  return (
    <div className="home-page">
      <div className="welcome-card">
        <div className="welcome-text">
          <h1>Welcome back, John!</h1>
          <p>Here's what's happening with your projects today.</p>
        </div>
        <div className="welcome-actions">
          <button className="btn primary">View Reports</button>
          <button className="btn secondary">New Project</button>
        </div>
      </div>

      <div className="stat-cards">
        {stats.map((stat, index) => (
          <div className="stat-card" key={index}>
            <div className="stat-header">
              <h3>{stat.label}</h3>
              <div className={`trend ${stat.up ? 'up' : 'down'}`}>
                {stat.trend}
              </div>
            </div>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="chart-card">
          <div className="card-header">
            <h3>Performance Overview</h3>
            <div className="card-actions">
              <select>
                <option>This Week</option>
                <option>This Month</option>
                <option>This Year</option>
              </select>
            </div>
          </div>
          <div className="chart-placeholder">
            {/* Placeholder for chart - would integrate with actual chart library */}
            <div className="mock-chart">
              <div className="mock-bar" style={{ height: '60%' }}></div>
              <div className="mock-bar" style={{ height: '80%' }}></div>
              <div className="mock-bar" style={{ height: '40%' }}></div>
              <div className="mock-bar" style={{ height: '70%' }}></div>
              <div className="mock-bar" style={{ height: '90%' }}></div>
              <div className="mock-bar" style={{ height: '50%' }}></div>
              <div className="mock-bar" style={{ height: '75%' }}></div>
            </div>
          </div>
        </div>

        <div className="activity-card">
          <div className="card-header">
            <h3>Recent Activity</h3>
            <button className="view-all">View All</button>
          </div>
          <ul className="activity-list">
            {recentActivities.map((activity, index) => (
              <li key={index}>
                <div className="activity-avatar">{activity.user.charAt(0)}</div>
                <div className="activity-details">
                  <p><strong>{activity.user}</strong> {activity.action}</p>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// Placeholder for other pages
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="placeholder-page">
      <h1>{title} Page</h1>
      <p>This is a placeholder for the {title} page content.</p>
    </div>
  );
};

export default Dashboard;