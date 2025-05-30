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

    console.log("Form Data:", requirementStatement, requirementType, description, selectedFileIds);

    // ตรวจสอบว่าฟอร์มมีข้อมูลครบหรือไม่
    if (!requirementStatement || !requirementType || !description || selectedFileIds.length === 0) {
      setError("Please fill in all fields.");
      return;
    }

    const newRequirement = {
      requirement_name: requirementStatement,
      requirement_type: requirementType,
      requirement_description: description,
      project_id: projectId,
      filereq_ids: selectedFileIds,
      requirement_status: "WORKING", // กำหนดสถานะเริ่มต้นเป็น WORKING
    };

    try {
      // ส่งคำขอไปยัง API เพื่อสร้าง requirement ใหม่
      const response = await axios.post("http://localhost:3001/requirement", newRequirement);

      // ตรวจสอบว่าการสร้าง requirement สำเร็จหรือไม่
      if (response.status === 201) {
        console.log("Requirement created successfully:", response.data);

        const requirementId = response.data.requirement_id; // ดึง requirement_id จาก response

        // ตรวจสอบว่า requirement_id มีค่า
        if (!requirementId) {
          throw new Error("Requirement ID is missing from response.");
        }

        // ส่งข้อมูลไปยัง API เพื่อบันทึกประวัติใน historyreq
        const historyReqData = {
          requirement_id: requirementId,
          requirement_status: newRequirement.requirement_status,
        };

        const historyResponse = await axios.post("http://localhost:3001/historyReqWorking", historyReqData);

        if (historyResponse.status === 200) {
          console.log("History added successfully:", historyResponse.data);
          alert("Requirement and history added successfully");

          // นำทางไปยังหน้า Dashboard
          navigate(`/Dashboard?project_id=${projectId}`, {
            state: { selectedSection: "Requirement" },
          });
        } else {
          console.error("Failed to add history:", historyResponse);
          alert("Failed to add history");
        }
      } else {
        console.error("Failed to create requirement:", response);
        alert("Failed to create requirement");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(error.response?.data?.message || "Something went wrong");
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
              label: `${file.filereq_id} - ${file.filereq_name}`

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
