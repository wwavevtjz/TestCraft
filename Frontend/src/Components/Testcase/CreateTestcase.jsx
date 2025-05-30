import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Select from "react-select"; // นำเข้า react-select
import "./testcase_css/CreateTestcase.css";

const CreateTestcase = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const projectId = new URLSearchParams(location.search).get("project_id");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [testType, setTestType] = useState("");
  const [customTestType, setCustomTestType] = useState("");
  const [priority, setPriority] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [attachmentType, setAttachmentType] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loggedInUser, setLoggedInUser] = useState("");
  const [implementFiles, setImplementFiles] = useState([]);
  const [selectedImplement, setSelectedImplement] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) setLoggedInUser(user.username);
  }, []);

  useEffect(() => {
    if (attachmentType) fetchAttachments(attachmentType);
  }, [attachmentType]);

  useEffect(() => {
    // Fetch implement files
    const fetchImplementFiles = async () => {
      try {
        const response = await axios.get('http://localhost:3001/implementrelation');
        setImplementFiles(response.data.data || []);
      } catch (error) {
        console.error('Error fetching implementation files:', error);
      }
    };
    fetchImplementFiles();
  }, []);

  const fetchAttachments = async (type) => {
    if (!projectId || !type) return;

    setLoading(true);
    setError("");
    setAttachments([]);

    try {
      const response = await axios.get(`http://localhost:3001/project/${projectId}/attachments`);
      const data = response.data || {};

      setAttachments(type === "requirement" ? data.requirements || [] : data.designs || []);
    } catch (error) {
      setError("Failed to load attachments.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestCase = async () => {
    if (!title || !description || !testType || !priority || !completionDate) {
      alert("Please fill in all required fields.");
      return;
    }
  
    if (selectedImplement.length === 0) { // ตรวจสอบว่าเลือก implement_id หรือยัง
      alert("Please select at least one implement.");
      return;
    }
  
    const testCaseData = {
      testcase_name: title,
      testcase_des: description,
      testcase_type: testType === "Other" ? customTestType : testType,
      testcase_priority: priority,
      testcase_by: loggedInUser,
      testcase_at: completionDate,
      testcase_attach: attachmentType && attachments.length > 0
        ? attachments[0].requirement_id || attachments[0].design_id
        : null,
      testcase_status: "WORKING",
      project_id: projectId,
      implement_id: selectedImplement.length > 0 ? selectedImplement[0].value : null, // ส่งค่าจาก implement_id ตัวแรก
    };
  
    try {
      const response = await axios.post("http://localhost:3001/testcases", testCaseData);
  
      if (response.status === 201) {
        const { testcase_id, test_execution_id } = response.data;
        console.log(`✅ Testcase ID: ${testcase_id}, Execution ID: ${test_execution_id}`);
  
        alert("Test Case and Execution created successfully!");
        navigate(`/Dashboard?project_id=${projectId}`);
      }
    } catch (error) {
      console.error("Error creating test case:", error);
      alert("Failed to create test case. Please try again.");
    }
  };
  

  const handleSelectChange = (selectedOptions) => {
    setSelectedImplement(selectedOptions);
  };

  return (
    <div className="create-testcase">
      <h2>Create Test Case</h2>

      {[{ label: "Title", value: title, setter: setTitle },
      { label: "Description", value: description, setter: setDescription }].map(({ label, value, setter }) => (
        <div key={label} className="create-testcase-form-group">
          <label>{label}:</label>
          <input type="text" value={value} onChange={(e) => setter(e.target.value)} />
        </div>
      ))}

      <div className="create-testcase-form-group">
        <label>Test Type:</label>
        <select value={testType} onChange={(e) => setTestType(e.target.value)}>
          <option value="">Select Test Type</option>
          <option value="Functional Testing">Unit Test</option>
          <option value="Non-Functional Testing">Integration Test</option>
          <option value="Regression Testing">System Test</option>
          <option value="Performance Testing">Acceptance Test</option>
          <option value="Other">Other</option>
        </select>
        {testType === "Other" && <input type="text" placeholder="Specify other test type" value={customTestType} onChange={(e) => setCustomTestType(e.target.value)} />}
      </div>

      <div className="create-testcase-form-group">
        <label>Priority:</label>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">Select Priority</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      <div className="create-testcase-form-group">
        <label>Test Completion Date:</label>
        <input type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} />
      </div>

      <div className="create-testcase-form-group">
        <label>Attachments:</label>
        <select value={attachmentType} onChange={(e) => setAttachmentType(e.target.value)}>
          <option value="">Select Attachment Type</option>
          <option value="requirement">Requirement</option>
          <option value="design">Design</option>
        </select>
      </div>

      {attachmentType && (
        <div className="create-testcase-form-group">
          <label>Select {attachmentType}:</label>
          {loading ? <p>Loading {attachmentType}...</p> : error ? <p className="error-message">{error}</p> :
            attachments.length > 0 ? (
              <select>
                <option value="">Select {attachmentType}</option>
                {attachments.map((item) => (
                  <option key={item.requirement_id || item.design_id} value={item.requirement_id || item.design_id}>
                    {attachmentType === "requirement" ? `REQ-00${item.requirement_id}` : `SD-00${item.design_id}`} - {item.requirement_name || item.diagram_name}
                  </option>
                ))}
              </select>
            ) : <p className="no-data-message">No {attachmentType} available</p>
          }
        </div>
      )}

      <div className="create-testcase-form-group">
        <label htmlFor="implementSelect">Select Implement (Multiple):</label>
        <Select
          id="implementSelect"
          isMulti // ใช้ isMulti เพื่อให้เลือกหลายค่าได้
          options={implementFiles.map(item => ({
            value: item.implement_id,
            label: `${item.implement_filename} (ID: ${item.implement_id})`
          }))}
          value={selectedImplement} // แสดงค่าที่เลือก
          onChange={handleSelectChange} // จัดการเมื่อมีการเปลี่ยนแปลง
        />
      </div>

      <div className="create-testcase-button-group">
        <button onClick={() => navigate(`/Dashboard?project_id=${projectId}`, { state: { selectedSection: "Testcase" } })} className="create-testcase-cancel-button">Cancel</button>
        <button onClick={handleCreateTestCase} className="create-testcase-save-button">Create</button>
      </div>
    </div>
  );
};

export default CreateTestcase;
