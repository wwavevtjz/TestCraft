import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import "./CSS/CreateRequirement.css";
import { useNavigate, useLocation } from "react-router-dom";

const UpdateRequirement = () => {
  const [requirementStatement, setRequirementStatement] = useState("");
  const [requirementType, setRequirementType] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { requirementId, projectId } = location.state || {};

  useEffect(() => {
    if (requirementId) {
      setIsLoading(true);
      axios
        .get(`http://localhost:3001/requirement/${requirementId}`)
        .then((response) => {
          const requirementData = response.data;
          setRequirementStatement(requirementData.requirement_name);
          setRequirementType(requirementData.requirement_type);
          setDescription(requirementData.requirement_description);
          setSelectedFileId(requirementData.file_id || "");
        })
        .catch(() => setError("Failed to load requirement details."))
        .finally(() => setIsLoading(false));
    }
  }, [requirementId]);

  useEffect(() => {
    if (projectId) {
      axios
        .get(`http://localhost:3001/files?project_id=${projectId}`)
        .then((response) => setUploadedFiles(response.data))
        .catch(() => setError("Failed to load uploaded files."));
    }
  }, [projectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!requirementStatement || !requirementType || !description) {
      setError("Please fill in all fields.");
      return;
    }

    const updatedRequirement = {
      requirement_name: requirementStatement,
      requirement_type: requirementType,
      requirement_description: description,
      project_id: projectId,
      file_id: selectedFileId,
      requirement_status: "WORKING",
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
      } else {
        setError("Failed to update requirement.");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Something went wrong");
    }
  };

  const clearError = () => setError("");

  if (isLoading) return <p>Loading...</p>;

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
            onChange={(e) => {
              clearError();
              setRequirementStatement(e.target.value);
            }}
            placeholder="Enter requirement statement"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="requirementType">Type</label>
          <select
            id="requirementType"
            value={requirementType}
            onChange={(e) => {
              clearError();
              setRequirementType(e.target.value);
            }}
            required
          >
            <option value="" disabled>
              Select Type
            </option>
            {/* Options */}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => {
              clearError();
              setDescription(e.target.value);
            }}
            placeholder="Enter requirement description"
            rows="4"
            required
          ></textarea>
        </div>
        <div className="form-group">
          <label htmlFor="fileSelect">Attach File</label>
          <select
            id="fileSelect"
            value={selectedFileId}
            onChange={(e) => setSelectedFileId(e.target.value)}
          >
            <option value="" disabled>
              Select a file
            </option>
            {uploadedFiles.length > 0 ? (
              uploadedFiles.map((file) => (
                <option key={file.id} value={file.id}>
                  {file.name}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No files available
              </option>
            )}
          </select>
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

UpdateRequirement.propTypes = {
  location: PropTypes.shape({
    state: PropTypes.shape({
      requirementId: PropTypes.string.isRequired,
      projectId: PropTypes.string.isRequired,
    }),
  }),
};

export default UpdateRequirement;
