import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash, faPlus, faCheckSquare, faFileUpload, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import "./CSS/RequirementPage.css";

const RequirementPage = () => {
  const [requirementList, setRequirementList] = useState([]);
  const [selectedRequirements, setSelectedRequirements] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projectName, setProjectName] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get("project_id");

  useEffect(() => {
    if (projectId) {
      setLoading(true);

      // Fetch project name
      axios
        .get(`http://localhost:3001/project/${projectId}`)
        .then((res) => {
          setProjectName(res.data.project_name);
        })
        .catch((err) => {
          console.error("Error fetching project name:", err);
          setError("Failed to load project name. Please try again.");
        });

      // Fetch requirements from the project
      axios
        .get(`http://localhost:3001/project/${projectId}/requirement`)
        .then((res) => {
          const updatedRequirements = res.data.map((requirement) => ({
            ...requirement,
            status: "WORKING",
          }));
          setRequirementList(updatedRequirements);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching requirements:", err);
          setError("Failed to load requirements. Please try again.");
          setLoading(false);
        });
    }
  }, [projectId]);

  const filteredRequirements = requirementList.filter((requirement) =>
    requirement.requirement_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    requirement.requirement_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    requirement.requirement_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `REQ-00${requirement.requirement_id}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectRequirement = (id) => {
    const selectedRequirement = requirementList.find(req => req.requirement_id === id);
    setSelectedRequirements((prev) =>
      prev.some((req) => req.requirement_id === id)
        ? prev.filter((req) => req.requirement_id !== id)
        : [...prev, selectedRequirement]
    );
  };


  const handleDelete = (requirementId) => {
    if (window.confirm("Are you sure you want to delete this requirement?")) {
      axios
        .delete(`http://localhost:3001/requirement/${requirementId}`)
        .then((response) => {
          console.log("Requirement deleted:", response.data);
          setRequirementList((prev) =>
            prev.filter((req) => req.requirement_id !== requirementId)
          );
        })
        .catch((err) => {
          console.log("Error deleting requirement:", err);
        });
    }
  };

  const handleFileUpload = (e) => {
    // Handle file upload logic here
  };

  const handleUploadSubmit = () => {
    // Handle file submit logic here
  };

  return (
    <div className="requirement-container">
      <div className="top-section">
        <h1 className="requirement-title">Project {projectName || projectId} Requirements</h1>
        <div className="action-buttons">
          <button className="review-button" onClick={() => navigate("/ReviewReqVeri")}>
            <FontAwesomeIcon icon={faCheckSquare} /> Review Verification
          </button>
          <button
            className="verify-button"
            onClick={() =>
              navigate("/ReqVerification", { state: { selectedRequirements } })
            }
          >
            <FontAwesomeIcon icon={faCheckSquare} /> Verification
          </button>
          <button
            onClick={() => navigate(`/CreateRequirement?project_id=${projectId}`)}
            className="add-requirement-button"
          >
            <FontAwesomeIcon icon={faPlus} /> Add Requirements
          </button>
        </div>
      </div>

      <div className="req-search">
        <input
          type="text"
          className="req-search-input"
          placeholder="Search Requirement"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <FontAwesomeIcon icon={faMagnifyingGlass} className="search-icon-req" />
      </div>

      <div className="content-container">
        {loading ? (
          <p>Loading requirements...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : filteredRequirements.length === 0 ? (
          <p>No requirements available for this project.</p>
        ) : (
          <table className="requirement-table">
            <thead>
              <tr>
                <th>Select</th>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Description</th>
                <th>Actions</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequirements.map((data) => (
                <tr key={data.requirement_id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRequirements.some((req) => req.requirement_id === data.requirement_id)}
                      onChange={() => handleSelectRequirement(data.requirement_id)}
                    />
                  </td>
                  <td>REQ-00{data.requirement_id}</td>
                  <td>{data.requirement_name}</td>
                  <td>{data.requirement_type}</td>
                  <td>{data.requirement_description}</td>
                  <td>
                    <button
                      onClick={() => navigate(`/UpdateRequirement?project_id=${projectId}`)}
                      className="action-button edit-req"
                    >
                      <FontAwesomeIcon icon={faPen} className="action-icon" />
                    </button>
                    <button
                      onClick={() => handleDelete(data.requirement_id)}
                      className="action-button delete-req"
                    >
                      <FontAwesomeIcon icon={faTrash} className="action-icon" />
                    </button>
                  </td>
                  <td>{data.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* File Upload Section */}
      <div className="file-upload-section">
        <h3>File</h3>
        <div className="file-upload-container">
          <input type="file" onChange={handleFileUpload} className="file-input" />
          <button onClick={handleUploadSubmit} className="upload-button">
            <FontAwesomeIcon icon={faFileUpload} /> Add File
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequirementPage;
