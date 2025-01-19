import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Comment from "./Comment";
import "./CSS/ReqVerification.css";

const ReqVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedRequirements, project_id } = location.state || {};

  const [reqcriList, setReqcriList] = useState([]);
  const [requirementsDetails, setRequirementsDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkboxState, setCheckboxState] = useState({}); // Store checkbox states
  const [allChecked, setAllChecked] = useState(false); // Check if all checkboxes are selected

  useEffect(() => {
    if (!project_id) {
      console.error("Project ID is missing or undefined");
      navigate("/VerificationList");
      return;
    }

    if (selectedRequirements && selectedRequirements.length > 0) {
      fetchRequirementsDetails(selectedRequirements);
    }

    fetchCriteria();
  }, [project_id, selectedRequirements, navigate]);

  const fetchCriteria = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3001/reqcriteria");
      const initialCheckboxState = response.data.reduce((acc, criteria) => {
        acc[criteria.reqcri_id] = false; // Initialize all checkboxes to false
        return acc;
      }, {});
      setCheckboxState(initialCheckboxState);
      setReqcriList(response.data);
    } catch (error) {
      console.error("Error fetching criteria:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleCheckboxChange = (id) => {
    const updatedState = {
      ...checkboxState,
      [id]: !checkboxState[id],
    };
    setCheckboxState(updatedState);

    // Check if all checkboxes are selected
    const isAllChecked = Object.values(updatedState).every((isChecked) => isChecked);
    setAllChecked(isAllChecked);
  };

  const handleSave = async () => {
    if (!allChecked) {
      alert("Please select all checkboxes before saving.");
      return;
    }

    if (!project_id || requirementsDetails.length === 0) {
      alert("Project ID or requirements details are missing. Cannot update status.");
      return;
    }

    try {
      const verificationIds = requirementsDetails.map((req) => req.verification_id);
      const requirementIds = requirementsDetails.map((req) => req.requirement_id);

      // Update verification status
      await axios.put("http://localhost:3001/update-status-verifications", {
        verification_ids: verificationIds,
        verification_status: "VERIFIED",
      });

      // Update requirement status
      await axios.put("http://localhost:3001/update-requirements-status-verified", {
        requirement_ids: requirementIds,
        requirement_status: "VERIFIED",
      });

      alert("Status updated to VERIFIED successfully.");
      navigate(`/Dashboard?project_id=${project_id}`);
    } catch (error) {
      console.error("Error updating status:", error.response || error.message);
      alert("Failed to update status.");
    }
  };

  return (
    <div className="container">
      <h1 className="title">Verification Requirement</h1>

      <div className="flex-container">
        <div className="box">
          <h2>Checklist</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ul className="checklist">
              {reqcriList.map((criteria) => (
                <li key={criteria.reqcri_id}>
                  <label>
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={checkboxState[criteria.reqcri_id] || false}
                      onChange={() => handleCheckboxChange(criteria.reqcri_id)}
                    />
                    {criteria.reqcri_name}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="box">
          <Comment />
        </div>
      </div>

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

      <div className="button-container">
        <button className="save-button" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
};

export default ReqVerification;
