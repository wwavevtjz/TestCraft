import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import "./CSS/Baseline.css";

const DesignBaseline = () => {
  const [designBaselines, setDesignBaselines] = useState([]);
  const [selectedDesign, setSelectedDesign] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get("project_id");

  // ดึงข้อมูล Baselines
  const fetchBaselines = useCallback(() => {
    axios
      .get(`http://localhost:3001/designbaseline?project_id=${projectId}`)
      .then((response) => {
        setDesignBaselines(response.data);
      })
      .catch((err) => {
        console.error("Error fetching design baseline:", err);
        toast.error("Error fetching design baseline.");
      });
  }, [projectId]);

  useEffect(() => {
    fetchBaselines();
  }, [fetchBaselines]);

  // ฟังก์ชันลิงก์ไปหน้า Create Baseline
  const handleSetBaselineClick = () => {
    navigate(`/CreateDesignbaseline?project_id=${projectId}`);
  };

  const handleViewDesign = (designId) => {
    setSelectedDesign([designId]);
    setIsModalOpen(true);
  };

  const handleBack = () => {
    navigate(`/Dashboard?project_id=${projectId}`);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDesign([]);
  };

  return (
    <div className="baseline-container">
      <h1>List Baseline</h1>
      <div className="action-bar">
        <button className="btn-create-baseline" onClick={handleSetBaselineClick}>
          Set Baseline
        </button>
      </div>
      <div className="list-baseline">
        {designBaselines.length === 0 ? (
          <p>No baselines available.</p>
        ) : (
          <table className="baseline-table">
            <thead>
              <tr>
                <th>Baseline</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {designBaselines.map((baseline) => (
                <tr key={baseline.baselinedesign_id}>
                  <td>{`BL${baseline.baselinedesign_round}`}</td>
                  <td>{new Date(baseline.baselinedesign_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="view-details-button"
                      onClick={() => handleViewDesign(baseline.design_id)}
                    >
                      View Design
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <button className="modal-close-button" onClick={handleBack}>
        Back
      </button>
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Design</h2>
            {selectedDesign.length === 0 ? (
              <p>No Design available.</p>
            ) : (
              <ul>
                {selectedDesign.map((design, index) => (
                  <li key={index}>{design}</li>
                ))}
              </ul>
            )}
            <button className="modal-close-button" onClick={closeModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignBaseline;
