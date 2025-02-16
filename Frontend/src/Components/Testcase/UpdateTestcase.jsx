import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./testcase_css/CreateTestcase.css";

const UpdateTestcase = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get("project_id");
  const testcaseId = queryParams.get("testcase_id");

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

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) setLoggedInUser(user.username);
  }, []);

  useEffect(() => {
    if (testcaseId) {
      fetchTestcaseDetails();
    } else {
      console.error("testcaseId is null or undefined.");
    }
  }, [testcaseId]);
  
  const fetchTestcaseDetails = async () => {
    if (!testcaseId) {
      setError("Invalid Test Case ID.");
      return;
    }
  
    setLoading(true);
    setError("");
  
    try {
      console.log(`Fetching testcase details for ID: ${testcaseId}`);
  
      const response = await axios.get(`http://localhost:3001/testcases/${testcaseId}`);
      const testcase = response.data;
  
      if (!testcase) {
        throw new Error("Test case not found.");
      }
  
      console.log("Test case data received:", testcase);
  
      setTitle(testcase.testcase_name || "");
      setDescription(testcase.testcase_des || "");
      setTestType(testcase.testcase_type || "");
      setPriority(testcase.testcase_priority || "");
      setCompletionDate(testcase.testcase_at || "");
      setAttachmentType(testcase.testcase_attach ? "requirement" : "");
    } catch (error) {
      console.error("Error fetching test case details:", error);
      setError("Failed to load test case details. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
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

  const handleUpdateTestCase = async () => {
    if (!title || !description || !testType || !priority || !completionDate) {
      alert("Please fill in all required fields.");
      return;
    }

    const testCaseData = {
      testcase_name: title,
      testcase_des: description,
      testcase_type: testType === "Other" ? customTestType : testType,
      testcase_priority: priority,
      testcase_at: completionDate,
      testcase_attach: attachmentType && attachments.length > 0 ? attachments[0].requirement_id || attachments[0].design_id : null,
    };

    try {
      await axios.put(`http://localhost:3001/testcases/${testcaseId}`, testCaseData);
      alert("Test Case updated successfully!");
      navigate(`/Dashboard?project_id=${projectId}`);
    } catch (error) {
      alert("Failed to update test case. Please try again.");
    }
  };

  return (
    <div className="create-testcase">
      <h2>Update Test Case</h2>
      <div className="create-testcase-form-group">
        <label>Title:</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="create-testcase-form-group">
        <label>Description:</label>
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

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
        {testType === "Other" && <input type="text" value={customTestType} onChange={(e) => setCustomTestType(e.target.value)} />}
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

      <div className="create-testcase-button-group">
        <button onClick={() => navigate(`/Dashboard?project_id=${projectId}`)} className="create-testcase-cancel-button">Cancel</button>
        <button onClick={handleUpdateTestCase} className="create-testcase-save-button">Update</button>
      </div>
    </div>
  );
};

export default UpdateTestcase;
