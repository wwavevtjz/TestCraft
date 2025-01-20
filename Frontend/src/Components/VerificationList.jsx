import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import "./CSS/VerificationList.css";

// Modal Component
const Modal = ({ show, onClose, reviewers = [], requirements = [] }) => {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Details</h2>
        <div>
          <h3>Reviewers:</h3>
          {reviewers.length > 0 ? (
            <ul>
              {reviewers.map((reviewer, index) => (
                <li key={index}>{reviewer}</li>
              ))}
            </ul>
          ) : (
            <p>No reviewers found.</p>
          )}
        </div>
        <div>
          <h3>Requirements:</h3>
          {requirements.length > 0 ? (
            <ul>
              {requirements.map((req, index) => (
                <li key={index}>Requirement ID: {req}</li>
              ))}
            </ul>
          ) : (
            <p>No requirements found.</p>
          )}
        </div>
        <button className="close-modal-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

const VerificationList = () => {
  const [verifications, setVerifications] = useState([]);
  const [selectedReviewers, setSelectedReviewers] = useState([]);
  const [selectedRequirements, setSelectedRequirements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get("project_id");

  // Fetch verifications
  const fetchVerifications = useCallback(() => {
    axios
      .get(`http://localhost:3001/verifications?project_id=${projectId}`)
      .then((response) => {
        let filteredVerifications = response.data;
        setVerifications(filteredVerifications);
      })
      .catch((err) => {
        console.error("Error fetching verifications:", err);
        toast.error("Error fetching verifications.");
      });
  }, [projectId]);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  // Handle Search Reviewer button
  const handleSearchClick = (reviewers, requirements) => {
    setSelectedReviewers(reviewers || []);
    setSelectedRequirements(requirements || []);
    setShowModal(true);
  };

  // Handle Verify button
  const handleVerifyClick = (verificationId, selectedRequirements) => {
    if (!projectId || selectedRequirements.length === 0) {
      toast.error("Invalid project ID or no requirements selected.");
      return;
    }

    // ส่งทั้ง project_id และ verification_id ผ่าน query string
    navigate(`/ReqVerification?project_id=${projectId}&verification_id=${verificationId}`, {
      state: { selectedRequirements, project_id: projectId, verification_id: verificationId },
    });
  };

  const closeModal = () => setShowModal(false);

  return (
    <div className="verification-list-container">
      <h1>Verification List</h1>

      {verifications.length === 0 ? (
        <p>No verifications available.</p>
      ) : (
        <table className="verification-table">
          <thead>
            <tr>
              <th>Verification</th>
              <th>Create By</th>
              <th>Date Assigned</th>
              <th>Status</th>
              <th>Reviewer</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {verifications.map((verification) => (
              <tr key={verification.id}>
                <td>{verification.id}</td>
                <td>{verification.create_by}</td>
                <td>{new Date(verification.created_at).toLocaleDateString()}</td>
                <td>{verification.verification_status || " "}</td>
                <td>
                  <button
                    className="search-icon-button"
                    title="Search Reviewers and Requirements"
                    onClick={() =>
                      handleSearchClick(
                        verification.reviewers || [],
                        verification.requirements || []
                      )
                    }
                  >
                    🔍
                  </button>
                </td>
                <td>
                  <button
                    className="verify-button"
                    onClick={() =>
                      handleVerifyClick(verification.id, verification.requirements)
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

      <Modal
        show={showModal}
        onClose={closeModal}
        reviewers={selectedReviewers}
        requirements={selectedRequirements}
      />
    </div>
  );
};

export default VerificationList;