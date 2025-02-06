import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import "./CSS/Baseline.css";

const DesignBaseline = () => {
  const [designBaselines, setDesignBaselines] = useState([]);
  const [groupedBaselines, setGroupedBaselines] = useState(new Map());
  const [selectedDesigns, setSelectedDesigns] = useState([]);
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

  // จัดกลุ่ม Baseline ตาม baselinedesign_round
  useEffect(() => {
    const grouped = new Map();

    designBaselines.forEach((baseline) => {
      const key = baseline.baselinedesign_round;
      if (!grouped.has(key)) {
        grouped.set(key, {
          round: key,
          date: baseline.baselinedesign_at,
          designs: [],
        });
      }
      grouped.get(key).designs.push(baseline.design_id);
    });

    setGroupedBaselines(grouped);
  }, [designBaselines]);

  // ฟังก์ชันลิงก์ไปหน้า Create Baseline
  const handleSetBaselineClick = () => {
    navigate(`/CreateDesignbaseline?project_id=${projectId}`);
  };

  const handleViewDesign = (designs) => {
    setSelectedDesigns(designs);
    setIsModalOpen(true);
  };

  const handleBack = () => {
    navigate(`/Dashboard?project_id=${projectId}`);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDesigns([]);
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
        {groupedBaselines.size === 0 ? (
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
              {Array.from(groupedBaselines.values()).map((baseline) => (
                <tr key={baseline.round}>
                  <td>{`BL${baseline.round}`}</td>
                  <td>{new Date(baseline.date).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="view-details-button"
                      onClick={() => handleViewDesign(baseline.designs)}
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
            <h2>Designs in this Baseline</h2>
            {selectedDesigns.length === 0 ? (
              <p>No Design available.</p>
            ) : (
              <ul>
                {selectedDesigns.map((design, index) => (
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
