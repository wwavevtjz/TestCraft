import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Comment from "./Comment";
import "./CSS/ReqValidation.css";

const ReqValidation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ดึง project_id และ validation_id จาก URL
  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get("project_id");
  const validationId = queryParams.get("validation_id");

  const { selectedRequirements } = location.state || {};  
  const [requirementsDetails, setRequirementsDetails] = useState([]);

  useEffect(() => {
    if (!projectId || !validationId) {
      console.error("Project ID or Validation ID is missing");
      navigate("/ValidationList");
      return;
    }

    if (selectedRequirements && selectedRequirements.length > 0) {
      fetchRequirementsDetails(selectedRequirements);
    }
  }, [projectId, validationId, selectedRequirements, navigate]);

  const fetchRequirementsDetails = async (requirements) => {
    try {
      const response = await axios.get("http://localhost:3001/requirements", {
        params: { requirement_ids: requirements },
      });
      setRequirementsDetails(response.data);
    } catch (error) {
      console.error("Error fetching requirements:", error);
    }
  };

  const handleSave = async () => {
    if (!projectId || requirementsDetails.length === 0) {
      alert("Project ID or requirements details are missing. Cannot update status.");
      return;
    }

    try {
      const requirementIds = requirementsDetails.map((req) => req.requirement_id);

      await axios.put("http://localhost:3001/update-requirements-status-validated", {
        requirement_ids: requirementIds,
        requirement_status: "VALIDATED",
      });

      alert("Status updated to VALIDATED successfully.");
      navigate(`/Dashboard?project_id=${projectId}`);
    } catch (error) {
      console.error("Error updating status:", error.response || error.message);
      alert("Failed to update status.");
    }
  };

  return (
    <div className="container">
      <h1 className="title">Validation Requirement</h1>

      <div className="box requirements">
        <h2>Requirement</h2>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Requirements Statement</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {requirementsDetails.length > 0 ? (
              requirementsDetails.map((req, index) => (
                <tr key={index}>
                  <td>REQ-0{req.requirement_id}</td>
                  <td>{req.requirement_name}</td>
                  <td>{req.requirement_type}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3">No requirements details found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex-container">
        <div className="box">
          <Comment validationId={validationId} />  {/* ส่ง validationId ไปยัง Comment */}
        </div>
      </div>

      <div className="button-container">
        <button className="save-button" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
};

export default ReqValidation;
