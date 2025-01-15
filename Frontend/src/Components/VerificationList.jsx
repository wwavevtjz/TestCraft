import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CSS/VerificationList.css";

const VerificationList = () => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch the list of verifications
  useEffect(() => {
    axios
      .get("http://localhost:3001/verifications") // Adjust the URL based on your backend route
      .then((response) => {
        setVerifications(response.data);
        setError(null); // Clear previous error
      })
      .catch((err) => {
        setError("Failed to load verification data.");
        console.error("Error fetching verifications:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleVerifyClick = (selectedRequirements, projectId) => {
    navigate("/reqverification", {
      state: { selectedRequirements, project_id: projectId }
    });
  };

  return (
    <div className="verification-list-container">
      <h1>Verification List</h1>

      {loading ? (
        <p>Loading verifications...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : verifications.length === 0 ? (
        <p>No verifications found.</p>
      ) : (
        <table className="verification-table">
          <thead>
            <tr>
              <th>Requirement ID</th>
              <th>Create By</th>
              <th>Date</th>
              <th>Reviewer</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {verifications.map((verification) => (
              <tr key={verification.id}>
                <td>
                  {verification.requirements.map((req, index) => (
                    <div key={index}>REQ-0{req}</div>
                  ))}
                </td>
                <td>{verification.created_by}</td>
                <td>{new Date(verification.created_at).toLocaleDateString()}</td>
                <td>
                  <button className="search-icon-button" title="Search Reviewer">
                    🔍
                  </button>
                </td>
                <td>
                  <button
                    className="verify-button"
                    onClick={() =>
                      handleVerifyClick(verification.requirements, verification.project_id)
                    }
                  >
                    Verify
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default VerificationList;
