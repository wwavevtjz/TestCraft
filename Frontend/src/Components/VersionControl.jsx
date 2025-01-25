import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./CSS/VersionControl.css";
import backtoreq from "../image/arrow_left.png";

const VersionControl = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { requirementList } = location.state;

  const queryParams = new URLSearchParams(window.location.search);
  const projectId = queryParams.get("project_id");

  const [showModal, setShowModal] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState(null);

  // Format date and time
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const formattedDate = `${day}/${month}/${year}`;
    const formattedTime = `${hours}:${minutes}:${seconds}`;
    return { date: formattedDate, time: formattedTime };
  };

  // Fetch history data
  const fetchHistory = async (requirementId) => {
    setLoadingHistory(true);
    setError(null); // Reset error state before fetching
    try {
      const response = await axios.get("http://localhost:3001/getHistoryByRequirementId", {
        params: { requirement_id: requirementId },
      });
      setHistoryData(response.data.data || []);
    } catch (error) {
      setError("Error fetching history. Please try again.");
      console.error("Error fetching history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Handle viewing requirement details
  const handleViewClick = (requirement) => {
    setSelectedRequirement(requirement);
    setShowModal(true);
    fetchHistory(requirement.requirement_id); // Fetch history on click
  };

  return (
    <div className="version-control-container">
      <div className="version-control-header">
        <button
          className="version-control-backbutton"
          onClick={() =>
            navigate(`/Dashboard?project_id=${projectId}`, {
              state: { selectedSection: "Requirement" },
            })
          }
        >
          <img
            src={backtoreq}
            alt="Back to Requirements"
            className="backfromvercontrol"
          />
          Back
        </button>

        <h1 className="version-control-title">Version Control</h1>
      </div>
      <table className="version-control-main-table">
        <thead>
          <tr>
            <th>Requirement ID</th>
            <th>Requirement Name</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {requirementList.map((requirement) => (
            <tr key={requirement.requirement_id}>
              <td>REQ-{requirement.requirement_id}</td>
              <td>{requirement.requirement_name}</td>
              <td>
                <button
                  className="version-control-button"
                  onClick={() => handleViewClick(requirement)}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && selectedRequirement && (
        <div className="version-control-modal">
          <div className="version-control-modal-content">
            <h2>Requirement Details</h2>
            <p>
              <strong>Requirement ID:</strong> REQ-{selectedRequirement.requirement_id}
            </p>
            <p>
              <strong>Requirement Name:</strong> {selectedRequirement.requirement_name}
            </p>
            <h2>History:</h2>
            {error && <p className="error-message">{error}</p>}
            <table className="version-control-history-table">
              <thead>
                <tr>
                  <th>Requirement Status</th>
                  <th>Date</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {loadingHistory ? (
                  <tr>
                    <td colSpan="3">Loading history...</td>
                  </tr>
                ) : historyData.length > 0 ? (
                  historyData.map((history, index) => {
                    const { date, time } = formatDate(history.historyreq_at);
                    return (
                      <tr key={index}>
                        <td>{history.requirement_status}</td>
                        <td>{date}</td>
                        <td>{time}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="3">No history available</td>
                  </tr>
                )}
              </tbody>
            </table>
            <button className="close-button" onClick={() => setShowModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VersionControl;
