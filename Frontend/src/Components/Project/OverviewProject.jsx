import React from 'react';
import './Overview.css'; // สไตล์ที่กำหนดเองสำหรับการออกแบบ

const OverviewProject = () => {
  return (
    <div className="dashboard-overview-container">
      <div className="overview-header">
        <h1>Project Overview</h1>
        <div className="overview-profile">
          <img src="https://via.placeholder.com/40" alt="Profile" className="overview-profile-img" />
          <span>Welcome, User</span>
        </div>
      </div>
      
      <div className="overview-cards">
        <div className="overview-card">
          <h2>Active Projects</h2>
          <p>5</p>
        </div>
        <div className="overview-card">
          <h2>Upcoming Deadlines</h2>
          <p>2</p>
        </div>
        <div className="overview-card">
          <h2>Pending Reviews</h2>
          <p>3</p>
        </div>
      </div>

      <div className="overview-recent-activity">
        <h2>Recent Activities</h2>
        <ul>
          <li>Project X started - 1 hour ago</li>
          <li>Review submitted for Project Y - 2 hours ago</li>
          <li>New project added: Project Z - 1 day ago</li>
        </ul>
      </div>
    </div>
  );
};

export default OverviewProject;
