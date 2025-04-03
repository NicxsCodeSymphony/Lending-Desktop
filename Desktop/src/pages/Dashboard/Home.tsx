import React from "react";

const Home: React.FC = () => {
  return (
    <div className="page">
      <h1>Home</h1>
      <div className="card">
        <h3>Welcome to your Dashboard</h3>
        <p>This is your main dashboard overview. Here you can see a summary of your activities and important notifications.</p>
        <div className="stats-container">
          <div className="stat-box">
            <h4>Users</h4>
            <p className="stat-number">1,254</p>
          </div>
          <div className="stat-box">
            <h4>Revenue</h4>
            <p className="stat-number">$12,345</p>
          </div>
          <div className="stat-box">
            <h4>Projects</h4>
            <p className="stat-number">25</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;