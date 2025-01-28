import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import "./CSS/CreateDesign.css";

const CreateDesign = () => {
  const [baselineRequirements, setbaselineRequirements] = useState([]);
  const [designStatement, setDesignStatement] = useState("");
  const [designType, setDesignType] = useState("");
  const [diagramType, setDiagramType] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRequirementsId, setRequirementsId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(window.location.search);
  const projectId = queryParams.get("project_id");

  // Fetch Requirements with useCallback
  const fetchRequirements = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError("");

    try {
      const response = await axios.get(
        `http://localhost:3001/project/${projectId}/requirement`,
        { params: { status: "BASELINE" } }
      );
      const baseline = response.data.filter(
        (req) => req.requirement_status === "BASELINE"
      );
      setbaselineRequirements(baseline);
    } catch (error) {
      console.error("Error fetching requirements:", error);
      setError("Failed to load requirements. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [projectId]); // Include projectId as a dependency

  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]); // Add fetchRequirements to the dependency array

  // Handle File Upload
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("project_id", projectId);

    try {
      const response = await axios.post("http://localhost:3001/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        alert("File uploaded successfully");
        setSelectedFile(null);
      } else {
        alert("Failed to upload file");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setError("Failed to upload file. Please try again later.");
    }
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!designStatement || !designType || !diagramType || !description || selectedRequirementsId.length === 0) {
      setError("Please fill in all fields.");
      return;
    }
  
    const newDesign = {
      diagram_name: designStatement,
      design_type: designType,
      diagram_type: diagramType,
      design_description: description,
      project_id: projectId,
      design_status: "WORKING",
      requirement_id: selectedRequirementsId, // Ensure this is passed
    };
  
    try {
      const response = await axios.post("http://localhost:3001/design", newDesign);
  
      if (response.status === 201) {
        alert("Design added successfully");
  
        // Get the design_id from the created design to add the history
        const design_id = response.data.design_id;
  
        // Add the history design record
        await axios.post("http://localhost:3001/addHistoryDesign", {
          design_id: design_id,
          design_status: "WORKING",
        });
  
        navigate(`/Dashboard?project_id=${projectId}`, { state: { selectedSection: "Design" } });
      } else {
        alert("Failed to create design");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(error.response?.data?.message || "Something went wrong");
    }
  };
  
  return (
    <div className="create-design-container">
      <h1 className="create-design-header">Create Software Design</h1>
      {loading && <p className="loading-message">Loading...</p>}
      {error && <p className="create-design-error">{error}</p>}
      <form className="create-design-form" onSubmit={handleSubmit}>

        {/* Diagram Name */}
        <div className="create-design-form-group">
          <label htmlFor="designStatement">Diagram Name:</label>
          <input
            type="text"
            id="designStatement"
            value={designStatement}
            onChange={(e) => setDesignStatement(e.target.value)}
            placeholder="Enter Diagram Name"
            required
            className="create-design-input"
          />
        </div>

        {/* Design Type */}
        <div className="create-design-form-group">
          <label htmlFor="designType">Design Type:</label>
          <select
            id="designType"
            value={designType}
            onChange={(e) => setDesignType(e.target.value)}
            required
            className="create-design-select"
          >
            <option value="" disabled>
              Select Design Type
            </option>
            <option value="High-Level Design">High-Level Design</option>
            <option value="Low-Level Design">Low-Level Design</option>
          </select>
        </div>

        {/* Diagram Type */}
        <div className="create-design-form-group">
          <label htmlFor="diagramType">Diagram Type:</label>
          <select
            id="diagramType"
            value={diagramType}
            onChange={(e) => setDiagramType(e.target.value)}
            required
            className="create-design-select"
          >
            <option value="" disabled>
              Select Diagram Type
            </option>
            <option value="Prototype">Prototype</option>
            <option value="Flow Chart">Flow Chart</option>
            <option value="ER Diagram">ER Diagram</option>
            <option value="Pseudo Code">Pseudo Code</option>
          </select>
        </div>

        {/* Requirements ID */}
        <label htmlFor="designStatement">Requirement ID:</label>
        <Select
          isMulti
          options={baselineRequirements.map((req) => ({
            value: req.requirement_id,
            label: `REQ-${req.requirement_id}: ${req.requirement_name}`,
          }))}
          onChange={(selectedOptions) =>
            setRequirementsId(selectedOptions.map((option) => option.value))
          }
        />

        {/* File Upload */}
        <div className="create-design-form-group">
          <label htmlFor="fileUpload">Upload File:</label>
          <input
            type="file"
            id="fileUpload"
            onChange={handleFileChange}
            className="create-design-input-file"
          />
          <button
            type="button"
            className="create-design-btn-upload"
            onClick={handleFileUpload}
          >
            Upload File
          </button>
        </div>

        {/* Description */}
        <div className="create-design-form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description"
            rows="4"
            required
            className="create-design-textarea"
          ></textarea>
        </div>

        {/* Buttons */}
        <div className="create-design-buttons">
          <button
            type="button"
            className="create-design-btn-cancel"
            onClick={() =>
              navigate(`/Dashboard?project_id=${projectId}`, {
                state: { selectedSection: "Design" },
              })
            }
          >
            Cancel
          </button>
          <button type="submit" className="create-design-btn-next">
            Create
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateDesign;