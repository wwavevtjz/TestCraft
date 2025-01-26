import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import "./CSS/Baseline.css";

const Baseline = () => {
  const [baselines, setBaselines] = useState([]);
  const [selectedRequirements, setSelectedRequirements] = useState([]); // เก็บข้อมูล requirement ที่เลือก
  const [isModalOpen, setIsModalOpen] = useState(false); // สถานะเปิด/ปิด Modal
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get("project_id");

  // ดึงข้อมูล Baselines
  const fetchBaselines = useCallback(() => {
    axios
      .get(`http://localhost:3001/baselines?project_id=${projectId}`)
      .then((response) => {
        const baselinesData = response.data.map((baseline) => ({
          ...baseline,
          requirements: baseline.requirements || [],
        }));
        setBaselines(baselinesData);
      })
      .catch((err) => {
        console.error("Error fetching baselines:", err);
        toast.error("Error fetching baselines.");
      });
  }, [projectId]);

  useEffect(() => {
    fetchBaselines();
  }, [fetchBaselines]);

  // ฟังก์ชันลิงก์ไปหน้า Create Baseline
  const handleSetBaselineClick = () => {
    navigate(`/CreateBaseline?project_id=${projectId}`);
  };

  // เปิด Modal แสดงรายละเอียด Requirements
  const handleViewRequirements = (requirements) => {
    setSelectedRequirements(requirements);
    setIsModalOpen(true);
  };

  const handleBack = () => {
    navigate(`/Dashboard?project_id=${projectId}`);
  };

  // ปิด Modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequirements([]);
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
        {baselines.length === 0 ? (
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
              {baselines.map((baseline) => (
                <tr key={baseline.id}>
                  <td>{`BL${baseline.baseline_round}`}</td>
                  <td>{new Date(baseline.baseline_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="view-details-button"
                      onClick={() => handleViewRequirements(baseline.requirements)}
                    >
                      View Requirements
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button className="modal-close-button" onClick={handleBack}>
                      back
                    </button>
      {/* Modal สำหรับแสดง Requirements */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Requirements</h2>
            {selectedRequirements.length === 0 ? (
              <p>No requirements available.</p>
            ) : (
              <ul>
                {selectedRequirements.map((requirement, index) => (
                  <li key={index}>{requirement}</li>
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

export default Baseline;
