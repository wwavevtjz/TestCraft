import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./CSS/UpdateRequirement.css";

const UpdateRequirement = () => {
  const [requirementStatement, setRequirementStatement] = useState("");
  const [requirementType, setRequirementType] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(window.location.search);
  const projectId = queryParams.get("project_id");
  const requirementId = queryParams.get("requirement_id");

  // Retrieve the data passed from the RequirementPage component
  const requirementData = location.state?.requirementData;

  useEffect(() => {
    if (requirementData) {
      // Pre-fill fields if the data is passed from the RequirementPage
      setRequirementStatement(requirementData.requirement_name);
      setRequirementType(requirementData.requirement_type);
      setDescription(requirementData.requirement_description);
    } else if (requirementId) {
      // Fetch requirement data if no state is passed (in case of URL navigation)
      fetchRequirementFromAPI(requirementId);
    } else {
      setError("Invalid requirement data. Please go back and try again.");
    }
  }, [requirementData, requirementId]);

  const fetchRequirementFromAPI = async (id) => {
    try {
      const response = await axios.get(`http://localhost:3001/requirement/${id}`);
      if (response.data) {
        const requirementData = response.data;
        setRequirementStatement(requirementData.requirement_name);
        setRequirementType(requirementData.requirement_type);
        setDescription(requirementData.requirement_description);
      } else {
        setError("Requirement not found. Please check and try again.");
      }
    } catch (err) {
      setError("Failed to fetch requirement data. Please try again later.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updatedRequirement = {
      requirement_name: requirementStatement,
      requirement_type: requirementType,
      requirement_description: description,
    };

    try {
      const response = await axios.put(
        `http://localhost:3001/requirement/${requirementId}`,
        updatedRequirement
      );
      if (response.status === 200) {
        alert("Requirement updated successfully");
        navigate(`/Dashboard?project_id=${projectId}`, {
          state: { selectedSection: "Requirement" },
        });
      }
    } catch (error) {
      setError("Failed to update requirement. Please try again.");
    }
  };

  return (
    <div className="requirement-specification">
      <h1>Update Requirement</h1>
      {error && <p className="error-message">{error}</p>}
      <form className="requirement-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="requirementStatement">Requirement Statement</label>
          <input
            type="text"
            id="requirementStatement"
            value={requirementStatement}
            onChange={(e) => setRequirementStatement(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="requirementType">Type</label>
          <select
            id="requirementType"
            value={requirementType}
            onChange={(e) => setRequirementType(e.target.value)}
            required
          >
            <option value="" disabled>Select Type</option>
            <option value="Functional">Functionality</option>
            <option value="User interface">User interface</option>
            <option value="External interfaces">External interfaces</option>
            <option value="Reliability">Reliability</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Portability">Portability</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
            required
          ></textarea>
        </div>
        <div className="form-buttons">
          <button
            type="button"
            className="btn btn-back"
            onClick={() =>
              navigate(`/Dashboard?project_id=${projectId}`, {
                state: { selectedSection: "Requirement" },
              })
            }
          >
            Back to Requirements
          </button>
          <button type="submit" className="btn btn-primary">
            Update
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateRequirement;