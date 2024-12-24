import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import './CSS/Dashboard.css';

import RequirementPage from './RequirementPage';

const Dashboard = () => {
  const location = useLocation();
  const [selectedSection, setSelectedSection] = useState(localStorage.getItem('selectedSection') || 'Overview');
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ดึง project_id จาก query params ใน URL
  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get('project_id');  // ตรวจสอบว่าใช้ 'project_id'
  useEffect(() => {
    if (location.state && location.state.selectedSection) {
      setSelectedSection(location.state.selectedSection);  // อัปเดต selectedSection จาก state ที่ส่งมา
    }
  }, [location.state]);

  // ใช้ useEffect เพื่อดึงข้อมูลโปรเจค
  useEffect(() => {
    if (projectId) {
      setLoading(true);

      // หา project name จาก project_id
      axios
        .get(`http://localhost:3001/project/${projectId}`)
        .then((res) => {
          setProjectName(res.data.project_name);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching project name:", err);
          setError("Failed to load project name. Please try again.");
          setLoading(false);
        });
    }
  }, [projectId]);

  // เก็บการเลือก section ใน localStorage
  useEffect(() => {
    localStorage.setItem('selectedSection', selectedSection);
  }, [selectedSection]);

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <nav className="sidebar">
        {/* Project Name */}
        {projectName && <div className="sidebar-project-name">{projectName || projectId}</div>}

        {/* Project Section */}
        <div className="sidebar-section-title">PROJECT</div>
        <div
          className={`nav-link ${selectedSection === 'Overview' ? 'active' : ''}`}
          onClick={() => setSelectedSection('Overview')}
        >
          Overview
        </div>
        <div
          className={`nav-link ${selectedSection === 'Documentation' ? 'active' : ''}`}
          onClick={() => setSelectedSection('Documentation')}
        >
          Documentation
        </div>

        {/* Management Section */}
        <div className="sidebar-section-title">WORK PRODUCT</div>
        <div
          className={`nav-link ${selectedSection === 'Requirement' ? 'active' : ''}`}
          onClick={() => setSelectedSection('Requirement')}
        >
          Requirement
        </div>
        <div
          className={`nav-link ${selectedSection === 'Design' ? 'active' : ''}`}
          onClick={() => setSelectedSection('Design')}
        >
          Design
        </div>
        <div
          className={`nav-link ${selectedSection === 'Implementation' ? 'active' : ''}`}
          onClick={() => setSelectedSection('Implementation')}
        >
          Implementation
        </div>
        <div
          className={`nav-link ${selectedSection === 'Testcase' ? 'active' : ''}`}
          onClick={() => setSelectedSection('Testcase')}
        >
          Test case
        </div>
        <div
          className={`nav-link ${selectedSection === 'Review' ? 'active' : ''}`}
          onClick={() => setSelectedSection('Review')}
        >
          Review
        </div>
        <div
          className={`nav-link ${selectedSection === 'Baseline' ? 'active' : ''}`}
          onClick={() => setSelectedSection('Baseline')}
        >
          Baseline
        </div>
        <div
          className={`nav-link ${selectedSection === 'Traceability' ? 'active' : ''}`}
          onClick={() => setSelectedSection('Traceability')}
        >
          Traceability
        </div>

        {/* Automation Section */}
        <div className="sidebar-section-title">GUIDES</div>
        <div
          className={`nav-link ${selectedSection === 'Guide Tutorial' ? 'active' : ''}`}
          onClick={() => setSelectedSection('Guide Tutorial')}
        >
          Guide Tutorial
        </div>
      </nav>

      {/* Main Content Section */}
      <div className="content-container">
        {loading ? (
          <h2>Loading project details...</h2>
        ) : error ? (
          <h2>{error}</h2>
        ) : (
          <>
            {selectedSection === 'Overview' && <h2>Overview Content</h2>}
            {selectedSection === 'Documentation' && <h2>Documentation Content</h2>}
            {selectedSection === 'Requirement' && <RequirementPage />}
            {selectedSection === 'Design' && <h2>Design Content</h2>}
            {selectedSection === 'Implementation' && <h2>Implementation Content</h2>}
            {selectedSection === 'Testcase' && <h2>Test Case Content</h2>}
            {selectedSection === 'Review' && <h2>Review Content</h2>}
            {selectedSection === 'Baseline' && <h2>Baseline Content</h2>}
            {selectedSection === 'Traceability' && <h2>Traceability Content</h2>}
            {selectedSection === 'Guide Tutorial' && <h2>Guide Tutorial Content</h2>}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
