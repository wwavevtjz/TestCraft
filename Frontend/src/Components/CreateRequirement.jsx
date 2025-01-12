import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Select from "react-select"; // นำเข้า react-select
import "./CSS/CreateRequirement.css";

const CreateRequirement = () => {
  const [requirementStatement, setRequirementStatement] = useState("");
  const [requirementType, setRequirementType] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]); // State สำหรับไฟล์ที่อัปโหลด
  const [selectedFileIds, setSelectedFileIds] = useState([]); // State สำหรับเก็บ filereq_id หลายๆ ตัว
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(window.location.search);
  const projectId = queryParams.get("project_id");

  // ใช้ useEffect เพื่อดึงข้อมูลไฟล์ที่อัปโหลด
  useEffect(() => {
    if (projectId) {
      axios
        .get(`http://localhost:3001/files?project_id=${projectId}`)
        .then((res) => {
          setUploadedFiles(res.data); // เก็บไฟล์ที่ดึงมาจาก API
        })
        .catch((err) => {
          console.error("Error fetching files:", err);
        });
    }
  }, [projectId]);

  // ฟังก์ชันสำหรับการส่งข้อมูล
  const handleSubmit = async (e) => {
    e.preventDefault();

    // ตรวจสอบว่าข้อมูลที่กรอกครบถ้วนหรือไม่
    console.log("Form Data:", requirementStatement, requirementType, description, selectedFileIds);

    if (!requirementStatement || !requirementType || !description || selectedFileIds.length === 0) {
      setError("Please fill in all fields.");
      return;
    }

    // สร้างข้อมูลที่ต้องส่งไปที่เซิร์ฟเวอร์
    const newRequirement = {
      requirement_name: requirementStatement,
      requirement_type: requirementType,
      requirement_description: description,
      project_id: projectId,
      filereq_ids: selectedFileIds, // ส่งเป็น array ของ filereq_id (ไม่ต้อง stringify)
      requirement_status: "WORKING",
    };

    // ส่งข้อมูลไปยัง API
    try {
      const response = await axios.post("http://localhost:3001/requirement", newRequirement);
      console.log("API Response:", response); // ตรวจสอบการตอบกลับจาก API
      if (response.status === 201) {
        alert("Requirement created successfully");
        navigate(`/Dashboard?project_id=${projectId}`, {
          state: { selectedSection: "Requirement" },
        });
      } else {
        console.error("Failed to create requirement:", response);
        alert("Failed to create requirement");
      }
    } catch (error) {
      console.error("Error creating requirement:", error);
      if (error.response) {
        console.log("API Error Response:", error.response.data); // แสดงข้อความ error ที่ได้รับจาก API
        setError(error.response.data.message || "Something went wrong");
      } else {
        setError("Network error. Please try again.");
      }
    }
  };

  // ฟังก์ชันสำหรับการจัดการการเปลี่ยนแปลงของ react-select
  const handleFileChange = (selectedOptions) => {
    // เลือกหลายไฟล์โดยเก็บ `filereq_id` ของไฟล์ที่เลือก
    const selectedFileIds = selectedOptions ? selectedOptions.map(option => option.value) : [];
    setSelectedFileIds(selectedFileIds);
  };

  return (
    <div className="create-requirement-container">
      <h1 className="create-requirement-header">Create New Requirement</h1>
      {error && <p className="create-requirement-error">{error}</p>}
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
            <option value="" disabled>Select Type</option>
            <option value="Functional">Functionality</option>
            <option value="User interface">User interface</option>
            <option value="External interfaces">External interfaces</option>
            <option value="Reliability">Reliability</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Portability">Portability</option>
            <option value="Limitations Design and construction">Limitations Design and construction</option>
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
          <label htmlFor="fileSelect">Attach File(s)</label>
          <Select
            isMulti
            options={uploadedFiles.map((file) => ({
              value: file.filereq_id,
              label: file.filereq_name, // แสดงชื่อไฟล์
            }))}
            value={uploadedFiles.filter((file) => selectedFileIds.includes(file.filereq_id)).map((file) => ({
              value: file.filereq_id,
              label: file.filereq_name,
            }))}
            onChange={handleFileChange}
            placeholder="Select files"
            className="select-files"
            required
          />
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
            Create
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateRequirement;
