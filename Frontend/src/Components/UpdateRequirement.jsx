import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./CSS/CreateRequirement.css";

const UpdateRequirement = () => {
  const [requirementStatement, setRequirementStatement] = useState("");
  const [requirementType, setRequirementType] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(window.location.search);
  const projectId = queryParams.get("project_id");
  const requirementId = queryParams.get("requirement_id");

  // ตรวจสอบค่าของ projectId และ requirementId
  console.log('Project ID:', projectId);
  console.log('Requirement ID:', requirementId);

  useEffect(() => {
    if (projectId) {
      fetchData(fetchUploadedFiles);
      fetchData(fetchCreatedRequirements);
    }
    if (requirementId) {
      fetchRequirementData(); // ทำให้มั่นใจว่า fetchRequirementData ถูกเรียกเมื่อ requirementId มีค่า
    }
  }, [projectId, requirementId]);

  // ฟังก์ชันทั่วไปสำหรับดึงข้อมูลจาก API
  const fetchData = async (callback) => {
    setIsLoading(true);
    try {
      await callback();
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ดึงไฟล์ที่อัปโหลด
  const fetchUploadedFiles = async () => {
    const res = await axios.get(`http://localhost:3001/files?project_id=${projectId}`);
    setUploadedFiles(res.data);
  };

  // ดึงรายการความต้องการที่สร้างขึ้น
  const fetchCreatedRequirements = async () => {
    const res = await axios.get(`http://localhost:3001/requirements?project_id=${projectId}`);
    // console.log('Created Requirements:', res.data); // ตรวจสอบข้อมูล
  };

  // ดึงข้อมูล Requirement ที่จะอัปเดต
  const fetchRequirementData = async () => {
    try {
      const res = await axios.get(`http://localhost:3001/requirement/${requirementId}`);
      console.log('Requirement Data:', res.data); // ตรวจสอบข้อมูลที่ตอบกลับจาก API
      const { requirement_name, requirement_type, requirement_description, filereq_id } = res.data;
      setRequirementStatement(requirement_name); // ตั้งค่า requirement statement
      setRequirementType(requirement_type); // ตั้งค่า requirement type
      setDescription(requirement_description); // ตั้งค่า description
      setSelectedFileId(filereq_id); // ตั้งค่า selected file ID
    } catch (error) {
      console.error("Error fetching requirement data:", error);
    }
  };

  // ฟังก์ชันส่งข้อมูลเมื่อกดปุ่มอัปเดต
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requirementStatement || !requirementType || !description || !selectedFileId) {
      setError("Please fill in all fields.");
      return;
    }

    const updatedRequirement = {
      requirement_name: requirementStatement,
      requirement_type: requirementType,
      requirement_description: description,
      project_id: projectId,
      filereq_id: selectedFileId,
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
        alert("Failed to update requirement");
      }
    } catch (error) {
      console.error("Error updating requirement:", error);
      setError(error.response?.data?.message || "Network error. Please try again.");
    }
  };

  // ฟังก์ชันล้างข้อผิดพลาด
  const clearError = () => setError("");

  return (
    <div className="create-requirement-container">
      <h1 className="create-requirement-header">Update Requirement</h1>
      {isLoading && <p className="loading-message">Loading...</p>}
      {error && (
        <div className="error-container">
          <p className="create-requirement-error">{error}</p>
          <button onClick={clearError} className="clear-error-btn">Clear</button>
        </div>
      )}
      <form className="create-requirement-form" onSubmit={handleSubmit}>
        <div className="create-requirement-form-group">
          <label htmlFor="requirementStatement">Requirement Statement</label>
          <input
            type="text"
            id="requirementStatement"
            value={requirementStatement}
            onChange={(e) => setRequirementStatement(e.target.value)}
            placeholder="Enter requirement statement"
            required
            className="create-requirement-input"
          />
        </div>
        <div className="create-requirement-form-group">
          <label htmlFor="requirementType">Type</label>
          <select
            id="requirementType"
            value={requirementType}
            onChange={(e) => setRequirementType(e.target.value)}
            required
            className="create-requirement-select"
          >
            <option value="" disabled>
              Select Type
            </option>
            <option value="Functional">Functionality</option>
            <option value="User interface">User interface</option>
            <option value="External interfaces">External interfaces</option>
            <option value="Reliability">Reliability</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Portability">Portability</option>
            <option value="Limitations Design and construction">
              Limitations Design and construction
            </option>
            <option value="Interoperability">Interoperability</option>
            <option value="Reusability">Reusability</option>
            <option value="Legal and regulative">Legal and regulative</option>
          </select>
        </div>
        <div className="create-requirement-form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter requirement description"
            rows="4"
            required
            className="create-requirement-textarea"
          ></textarea>
        </div>
        <div className="create-requirement-form-group">
          <label htmlFor="fileSelect">Attach File</label>
          <select
            id="fileSelect"
            value={selectedFileId}
            onChange={(e) => setSelectedFileId(e.target.value)}
            required
            className="create-requirement-select"
          >
            <option value="" disabled>
              Select a file
            </option>
            {uploadedFiles.map((file) => (
              <option key={file.filereq_id} value={file.filereq_id}>
                {file.filereq_name}
              </option>
            ))}
          </select>
        </div>
        <div className="create-requirement-form-buttons">
          <button
            type="button"
            className="create-requirement-btn-back"
            onClick={() =>
              navigate(`/Dashboard?project_id=${projectId}`, {
                state: { selectedSection: "Requirement" },
              })
            }
          >
            Back to Requirements
          </button>
          <button type="submit" className="create-requirement-btn-primary">
            Update
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateRequirement;
