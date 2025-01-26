import React, { useState, useEffect } from "react";
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
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(window.location.search);
  const projectId = queryParams.get("project_id");

  // Fetch Requirements
  const fetchRequirements = async () => {
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
  };

  // Fetch Files
  const fetchFiles = async () => {
    if (projectId) {
      try {
        const response = await axios.get(
          `http://localhost:3001/files?project_id=${projectId}`
        );
        setUploadedFiles(response.data);
      } catch (error) {
        console.error("Error fetching files:", error);
      }
    }
  };

  useEffect(() => {
    fetchRequirements();
    fetchFiles();
  }, [projectId]);

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!designStatement || !designType || !diagramType || !description || selectedFileIds.length === 0) {
      setError("Please fill in all fields.");
      return;
    }

    const newDesign = {
      design_name: designStatement,
      design_type: designType,
      diagram_type: diagramType,
      design_description: description,
      project_id: projectId,
      filereq_ids: selectedFileIds,
      design_status: "IN PROGRESS",
    };

    try {
      const response = await axios.post("http://localhost:3001/design", newDesign);

      if (response.status === 201) {
        const designId = response.data.design_id;

        if (!designId) throw new Error("Design ID is missing from response.");

        const historyDesignData = {
          design_id: designId,
          design_status: newDesign.design_status,
        };

        const historyResponse = await axios.post(
          "http://localhost:3001/historyDesignWorking",
          historyDesignData
        );

        if (historyResponse.status === 200) {
          alert("Design and history added successfully");
          navigate(`/Dashboard?project_id=${projectId}`, { state: { selectedSection: "Design" } });
        } else {
          alert("Failed to add history");
        }
      } else {
        alert("Failed to create design");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(error.response?.data?.message || "Something went wrong");
    }
  };

  const handleFileChange = (selectedOptions) => {
    const fileIds = selectedOptions ? selectedOptions.map((option) => option.value) : [];
    setSelectedFileIds(fileIds);
  };

  return (
    <div className="create-design-container">
      <h1 className="create-design-header">Create Software Design</h1>
      {loading && <p className="loading-message">Loading...</p>}
      {error && <p className="create-design-error">{error}</p>}
      <form className="create-design-form" onSubmit={handleSubmit}>
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
            <option value="System Design">High-Level Design</option>
            <option value="UI/UX Design">Low-Level Design</option>
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

              {/* Requirements ID */}
              <label htmlFor="Requirement ID">Requirement ID:</label>
              <Select
                  isMulti
                  options={baselineRequirements.map((req) => ({
                      value: req.requirement_id, // ใช้ requirement_id เป็น value
                      label: `REQ-${req.requirement_id}: ${req.requirement_name}`, // รวมทั้งสองค่าใน label
                  }))}

                  value={baselineRequirements
                      .filter((req) => selectedFileIds.includes(req.requirement_id))
                      .map((req) => ({
                          value: req.requirement_id,
                          label: `REQ-${req.requirement_id}: ${req.requirement_name}`, // แสดง requirement_id และ name สำหรับ selected values
                      }))}

                  onChange={handleFileChange}
                  placeholder="Select Requirements"
                  className="select-files"
                  required
              />



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
