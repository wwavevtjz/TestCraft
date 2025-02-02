import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./CSS/DesignPage.css";

const DesignPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get("project_id");

  const [designs, setDesigns] = useState([]); // State for designs
  const [loading, setLoading] = useState(true); // Loading state

  // Fetch designs from the backend
  const fetchDesigns = async () => {
    try {
      const response = await axios.get("http://localhost:3001/design", {
        params: { project_id: projectId },
      });
      setDesigns(response.data); // Set the designs state
    } catch (error) {
      console.error("Error fetching designs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesigns(); // Fetch designs when the component loads
  }, [projectId]);

  // Navigate to the CreateDesign page
  const handleCreateDesign = () => {
    navigate(`/CreateDesign?project_id=${projectId}`);
  };

    // Navigate to the CreateVeriDesign page
    const handleCreateVeriDesign = () => {
      navigate(`/CreateVeriDesign?project_id=${projectId}`);
    };
  
    // Navigate to the CreateVeriDesign page
    const handleViewVeriDesign = () => {
      navigate(`/VeriDesign?project_id=${projectId}`);
    };

    // Navigate to the CreateVeriDesign page
    const handleViewBaseline = () => {
      navigate(`/DesignBaseline?project_id=${projectId}`);
    };

  return (
    <div className="designpage-container">
      <header className="designpage-header">
        <h1>Software Diagram</h1>
        <div className="designpage-header-buttons">
          <button className="create-design-button" onClick={handleCreateDesign}> Create Design </button>
          <button className="create-design-button" onClick={handleCreateVeriDesign}> CreateVeriDesign </button>
          <button className="create-design-button" onClick={handleViewVeriDesign}> View Verification </button>
          <button className="create-design-button" onClick={handleViewBaseline}> Baseline </button>
        </div>
      </header>

      <section className="designpage-summary">
        <h2>Overview Summary</h2>
        <table className="summary-table">
          <thead>
            <tr>
              <th>Design Type</th>
              <th>Total Diagram</th>
              <th>In Progress</th>
              <th>Verified</th>
            </tr>
          </thead>
          <tbody>
            {["High-Level Design", "Low-Level Design"].map((type) => {
              const filteredDesigns = designs.filter(
                (design) => design.design_type === type
              );
              return (
                <tr key={type}>
                  <td>{type}</td>
                  <td>{filteredDesigns.length}</td>
                  <td>{filteredDesigns.length}</td>
                  <td>{filteredDesigns.length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="designpage-diagrams">
        <h2>Diagrams</h2>
        {loading ? (
          <p>Loading diagrams...</p>
        ) : (
          <table className="diagram-table">
            <thead>
              <tr>
                <th>Design ID</th>
                <th>Diagram Name</th>
                <th>Type</th>
                <th>Design Type</th>
                <th>Action</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {designs.map((design) => (
                <tr key={design.design_id}>
                  <td>SD-0{design.design_id}</td>
                  <td>{design.diagram_name}</td>
                  <td>{design.diagram_type}</td>
                  <td>{design.design_type}</td>
                  <td>
                    <button className="btn action-btn">👁️</button>
                    <button className="btn action-btn">✏️</button>
                    <button className="btn action-btn">🗑️</button>
                  </td>
                  <td>{design.design_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default DesignPage;
