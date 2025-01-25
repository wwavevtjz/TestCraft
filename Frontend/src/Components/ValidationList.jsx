import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./CSS/ValidationList.css";
import closemodalreview from "../image/close.png";

const Modal = ({ show, onClose, requirements = [] }) => {
  if (!show) return null;
  return (
    <div className="modal-overlay-review">
      <div className="modal-content-review">
        <div>
          <h3>Requirements</h3>
          {Array.isArray(requirements) && requirements.length > 0 ? (
            requirements.map((req, index) => (
              <div key={index} className="req-review">
                Requirement ID: {req}
              </div>
            ))
          ) : (
            <div>No requirements found.</div>
          )}
        </div>
        <button className="close-modal-review-button" onClick={onClose}>
          <img src={closemodalreview} alt="Close Modal" className="closemodalreview-icon" />
        </button>
      </div>
    </div>
  );
};

const ValidationList = () => {
  const [validations, setValidations] = useState([]);
  const [selectedRequirements, setSelectedRequirements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get("project_id");

  const fetchValidations = useCallback(() => {
    axios
      .get(`http://localhost:3001/validations?project_id=${projectId}`)
      .then((response) => {
        console.log("API Response:", response.data); // ตรวจสอบข้อมูลจาก API
        const filteredValidations = response.data
          .filter((validation) => validation.requirement_status === "WAITING FOR VALIDATION")
          .map((validation) => ({
            ...validation,
            validation_by: validation.validation_by || [],
          }));
        setValidations(filteredValidations);
      })
      .catch((err) => {
        console.error("Error fetching validations:", err);
      });
  }, [projectId]);

  useEffect(() => {
    fetchValidations();
  }, [fetchValidations]);

  const handleSearchClick = (requirements) => {
    console.log("Requirements to display in modal:", requirements); // Debug data
    setSelectedRequirements(requirements || []);
    setShowModal(true);
  };

  const handleValidateClick = (validationId, selectedRequirements) => {
    if (!projectId || selectedRequirements.length === 0) {
      alert("Invalid project ID or no requirements selected.");
      return;
    }

    const storedUsername = localStorage.getItem("username");

    if (!storedUsername) {
      alert("No user found. Please log in.");
      return;
    }

    navigate(`/ReqValidation?project_id=${projectId}&validation_id=${validationId}`, {
      state: { selectedRequirements, project_id: projectId, validation_id: validationId },
    });
  };

  const closeModal = () => setShowModal(false);

  return (
    <div className="validation-list-container">
      <h1>Validation List</h1>
      {validations.length === 0 ? (
        <p>No validations available.</p>
      ) : (
        <table className="validation-table">
          <thead>
            <tr>
              <th>Validation</th>
              <th>Create By</th>
              <th>Date Assigned</th>
              <th>Status</th>
              <th>Requirement</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {validations.map((validation) => (
              <tr key={validation.id}>
                <td>{validation.id}</td>
                <td>{validation.create_by}</td>
                <td>{new Date(validation.created_at).toLocaleDateString()}</td>
                <td>{validation.requirement_status || " "}</td>
                <td>
                  <button
                    className="search-icon-button"
                    title="Search Validators and Requirements"
                    onClick={() => handleSearchClick(validation.requirements || [])}
                  >
                    🔍
                  </button>
                </td>
                <td>
                  <button
                    className="verify-button"
                    onClick={() =>
                      handleValidateClick(validation.id, validation.requirements)
                    }
                  >
                    Validate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Modal show={showModal} onClose={closeModal} requirements={selectedRequirements} />
    </div>
  );
};

export default ValidationList;
