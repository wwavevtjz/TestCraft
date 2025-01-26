import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CSS/Dashboard.css';

import RequirementPage from './RequirementPage';
import ProjectConfig from './ProjectConfig';
import DesignPage from './DesignPage';

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();  // ใช้ navigate สำหรับลิ้งค์กลับไปหน้า Project
  const [selectedSection, setSelectedSection] = useState(localStorage.getItem('selectedSection') || 'Overview');
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projectStatus, setProjectStatus] = useState('');

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
          setProjectStatus(res.data.project_status); // เพิ่มการดึงสถานะโปรเจกต์
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

  const handleCloseProject = async () => {
    const confirmation = window.confirm("คุณแน่ใจที่จะปิดโปรเจค?");
    if (confirmation) {
      try {
        // ดึงข้อมูลโปรเจกต์ปัจจุบัน
        const res = await axios.get(`http://localhost:3001/project/${projectId}`);
        const currentProject = res.data;

        // สร้างข้อมูลใหม่ที่มีสถานะ CLOSE แต่ข้อมูลอื่นเหมือนเดิม
        const updatedProject = {
          ...currentProject,
          project_status: 'CLOSED',
        };

        // ส่งข้อมูลไปยัง Backend
        await axios.put(`http://localhost:3001/project/${projectId}`, updatedProject);
        alert("Project closed successfully!");

        // อัปเดตสถานะโปรเจกต์ใน UI
        setProjectStatus('CLOSED');
        navigate('/Project');
      } catch (error) {
        console.error("Error closing project:", error);
        alert("Failed to close project. Please try again.");
      }
    }
  };


  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <nav className="dashboard-sidebar">
        {/* Project Name */}
        {projectName && <div className="dashboard-sidebar-project-name">{projectName || projectId}</div>}

        {/* Project Section */}
        <div className="dashboard-sidebar-section-title">PROJECT</div>
        <div
          className={`dashboard-nav-link ${selectedSection === 'Overview' ? 'active' : ''}`}
          onClick={() => setSelectedSection('Overview')}
        >
          Overview
        </div>
        <div
          className={`dashboard-nav-link ${selectedSection === 'Configuration' ? 'active' : ''}`}
          onClick={() => setSelectedSection('Configuration')}
        >
          Configuration
        </div>

        {/* Management Section */}
        <div className="dashboard-sidebar-section-title">WORK PRODUCT</div>
        <div
          className={`dashboard-nav-link ${selectedSection === 'Requirement' ? 'active' : ''}`}
          onClick={() => setSelectedSection('Requirement')}
        >
          Requirement
        </div>
        <div
          className={`dashboard-nav-link ${selectedSection === 'Design' ? 'active' : ''}`}
          onClick={() => setSelectedSection('Design')}
        >
          Design
        </div>
        <div
          className={`dashboard-nav-link ${selectedSection === 'Implementation' ? 'active' : ''}`}
          onClick={() => setSelectedSection('Implementation')}
        >
          Implementation
        </div>
        <div
          className={`dashboard-nav-link ${selectedSection === 'Testcase' ? 'active' : ''}`}
          onClick={() => setSelectedSection('Testcase')}
        >
          Test case
        </div>
        <div
          className={`dashboard-nav-link ${selectedSection === 'Review' ? 'active' : ''}`}
          onClick={() => setSelectedSection('Review')}
        >
          Review
        </div>
        <div
          className={`dashboard-nav-link ${selectedSection === 'Baseline' ? 'active' : ''}`}
          onClick={() => setSelectedSection('Baseline')}
        >
          Baseline
        </div>
        <div
          className={`dashboard-nav-link ${selectedSection === 'Traceability' ? 'active' : ''}`}
          onClick={() => setSelectedSection('Traceability')}
        >
          Traceability
        </div>

        {/* Automation Section */}
        <div className="dashboard-sidebar-section-title">GUIDES</div>
        <div
          className={`dashboard-nav-link ${selectedSection === 'Guide Tutorial' ? 'active' : ''}`}
          onClick={() => setSelectedSection('Guide Tutorial')}
        >
          Guide Tutorial
        </div>

        {/* Close Project Button in Sidebar */}
        {projectStatus !== 'CLOSE' && (
          <button onClick={handleCloseProject} className="dashboard-close-project-btn">
            Close Project
          </button>
        )}
      </nav>

      {/* Main Content Section */}
      <div className="dashboard-content-container">
        {loading ? (
          <h2>Loading project details...</h2>
        ) : error ? (
          <h2>{error}</h2>
        ) : (
          <>
            {selectedSection === 'Overview' && <h2>Overview Content</h2>}
            {selectedSection === 'Configuration' && <ProjectConfig />}
            {selectedSection === 'Requirement' && <RequirementPage />}
            {selectedSection === 'Design' && <DesignPage/>}
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
