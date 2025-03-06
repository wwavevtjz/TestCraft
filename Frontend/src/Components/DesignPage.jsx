import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import "./CSS/DesignPage.css";

const DesignPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get("project_id");

  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDesigns = async () => {
    try {
      const response = await axios.get("http://localhost:3001/design", {
        params: { project_id: projectId },
      });
      setDesigns(response.data);
    } catch (error) {
      console.error("Error fetching designs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesigns();
  }, [projectId]);

  return (
    <div className="design-container">
      <header className="design-header">
        <h1>Software Diagram</h1>
        <div className="design-header-buttons">
          <button className="design-btn" onClick={() => navigate(`/CreateDesign?project_id=${projectId}`)}>Create Design</button>
          <button className="design-btn" onClick={() => navigate(`/CreateVeriDesign?project_id=${projectId}`)}>Create Verification</button>
          <button className="design-btn" onClick={() => navigate(`/VeriDesign?project_id=${projectId}`)}>View Verification</button>
          <button className="design-btn" onClick={() => navigate(`/DesignBaseline?project_id=${projectId}`)}>Baseline</button>
        </div>
      </header>

      <section className="design-diagrams">
        <h2>Diagrams</h2>
        {loading ? (
          <p>Loading diagrams...</p>
        ) : (
          <table className="design-diagram-table">
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
                    <button className="design-action-btn view">
                      <FontAwesomeIcon icon={faEye} onClick={() => navigate(`/ViewDesign?project_id=${projectId}&design_id=${design.design_id}`)} />
                    </button>
                    <button className="design-action-btn edit">
                      <FontAwesomeIcon icon={faPen} onClick={() => navigate(`/UpdateDesign?project_id=${projectId}&design_id=${design.design_id}`)} />
                    </button>
                    <button className="design-action-btn delete">
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                  <td>
                    <span className={`status-btn ${design.design_status.toLowerCase()}`}>
                      {design.design_status}
                    </span>
                  </td>

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
