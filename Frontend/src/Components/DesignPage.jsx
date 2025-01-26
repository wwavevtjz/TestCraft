import React, { useState, useEffect  } from "react";
import { useNavigate, useLocation } from "react-router-dom"; 
import "./CSS/DesignPage.css";

const DesignPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get("project_id");

  // ขอปรับเป็น handleCreateDesign ใน navigate ก่อนถ้าลบแล้วมันเป็นไรไม่รู้งงเหมือนกัน
  const handleCreatedesign = () => {
    navigate(`/CreateDesign?project_id=${projectId}`);
  }

  return (
    <div className="designpage-container">
      <header className="designpage-header">
        <h1>Software Diagram</h1>
        <div className="designpage-header-buttons">
    
              <button className="create-design-button" onClick={handleCreatedesign}>
                <img className="createver" /> Create Design
              </button>

          <button className="btn">View Verification</button>
          <button className="btn">Create Verification</button>
          <button className="btn">Verification</button>
          <button className="btn">Baselined</button>
        </div>
      </header>

      <section className="designpage-summary">
        <h2>Overview Summary</h2>
        <table className="summary-table">
          <thead>
            <tr>
              <th>Design Type</th>
              <th>Total Diagram</th>
              <th>Verified</th>
              <th>In Progress</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>High-level software design</td>
              <td>10</td>
              <td>5</td>
              <td>5</td>
            </tr>
            <tr>
              <td>Low-level software design</td>
              <td>18</td>
              <td>8</td>
              <td>10</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="designpage-diagrams">
        <table className="diagram-table">
          <thead>
            <tr>
              <th>Diagram ID</th>
              <th>Diagram Name</th>
              <th>Type</th>
              <th>Level</th>
              <th>Requirement ID</th>
              <th>Action</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>DG-001</td>
              <td>User Flow</td>
              <td>Flowchart</td>
              <td>High-Level</td>
              <td>Req-001, Req-002</td>
              <td>
                <button className="btn action-btn">👁️</button>
                <button className="btn action-btn">✏️</button>
                <button className="btn action-btn">🗑️</button>
              </td>
              <td>Verified</td>
            </tr>
            <tr>
              <td>DG-002</td>
              <td>Sequence Diagram</td>
              <td>Sequence</td>
              <td>Low-Level</td>
              <td>Req-003, Req-004</td>
              <td>
                <button className="btn action-btn">👁️</button>
                <button className="btn action-btn">✏️</button>
                <button className="btn action-btn">🗑️</button>
              </td>
              <td>In Progress</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default DesignPage;
