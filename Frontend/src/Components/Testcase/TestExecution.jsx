import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./testcase_css/TestExecution.css";

const TestExecution = () => {
  const { testcaseId } = useParams();
  const [testProcedures, setTestProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testSteps, setTestSteps] = useState([]);
  const [testCase, setTestCase] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);

  const statusOptions = ["Passed", "Failed", "In Progress"];

  useEffect(() => {
    if (testcaseId) {
      axios.get(`http://localhost:3001/api/test_procedures/${testcaseId}`)
        .then((response) => {
          if (response.data.length > 0) {
            setTestProcedures(response.data);
            setTestSteps(response.data);
            setTestCase({
              testcase_id: response.data[0].testcase_id,
              testcase_at: response.data[0].testcase_at,
              tested_by: response.data[0].tested_by,
              testcase_name: response.data[0].testcase_name, // ตรวจสอบว่า API คืนค่านี้มาหรือไม่
            });
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching test procedures:", error);
          setError("Failed to load test procedures");
          setLoading(false);
        });
    }
  }, [testcaseId]);
  
  

  if (loading) return <p>Loading test procedures...</p>;
  if (error) return <p>{error}</p>;

  const handleStatusChange = (index, event) => {
    setTestSteps((prevSteps) =>
      prevSteps.map((step, i) =>
        i === index ? { ...step, test_status: event.target.value } : step
      )
    );
  };

  const handleActualResultChange = (index, event) => {
    setTestSteps((prevSteps) =>
      prevSteps.map((step, i) =>
        i === index ? { ...step, actual_result: event.target.value } : step
      )
    );
  };

  const handleSave = async () => {
    try {
      await axios.post("http://localhost:3001/api/update_test_execution", { testSteps });
      alert("Test Execution saved successfully!");
    } catch (error) {
      console.error("Error saving test execution:", error);
    }
  };

  const handleFileChange = async (index, event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("test_procedures_id", testSteps[index].test_procedures_id);
    formData.append("testcase_id", testCase.testcase_id);

    try {
      const response = await axios.post(
        "http://localhost:3001/api/upload_test_file",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      alert("File uploaded successfully!");

      setTestSteps((prevSteps) => {
        const updatedSteps = [...prevSteps];
        updatedSteps[index] = {
          ...updatedSteps[index],
          files: [...(updatedSteps[index].files || []), response.data],
        };
        return updatedSteps;
      });

      closeModal();
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("File upload failed!");
    }
  };

  const openModal = (step) => {
    setSelectedStep(step);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedStep(null);
  };

  return (
    <div className="TestExecution">
      <button className="save-button" onClick={handleSave}>Save</button>
      <h3>Test Execution : TC-0{testCase?.testcase_id || "-" } {testCase?.testcase_name || "Unknown"}</h3>
<p><strong>Completion Date:</strong> {testCase?.testcase_at ? new Date(testCase.testcase_at).toLocaleDateString("th-TH") : "-"}</p>
<p><strong>Tested By:</strong> {testCase?.tested_by || "Not Assigned"}</p>

      
      <table className="test-execution-table">
        <thead>
          <tr>
            <th>Step No</th>
            <th>Required Action</th>
            <th>Expected Result</th>
            <th>Prerequisite</th>
            <th>Test Status</th>
            <th>Actual Result</th>
            <th>Attachments</th>
          </tr>
        </thead>
        <tbody>
          {testSteps.length > 0 ? (
            testSteps.map((step, index) => (
              <tr key={step.test_procedures_id} data-status={step.test_status || "default"}>
                <td>{index + 1}</td>
                <td>{step.required_action}</td>
                <td>{step.expected_result}</td>
                <td>{step.prerequisite || "-"}</td>
                <td className={`status-cell ${step.test_status?.toLowerCase().replace(" ", "-") || ""}`}>
                  <select
                    value={step.test_status || ""}
                    onChange={(event) => handleStatusChange(index, event)}
                  >
                    <option value="">Select Status</option>
                    {statusOptions.map((status, idx) => (
                      <option key={idx} value={status}>{status}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    value={step.actual_result || ""}
                    onChange={(event) => handleActualResultChange(index, event)}
                  />
                </td>
                <td>
                  <button onClick={() => openModal(step)}>View Files</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="no-data">No Test Procedures Found</td>
            </tr>
          )}
        </tbody>
      </table>

      {modalOpen && selectedStep && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>File Details</h3>
            <p><strong>Test Step:</strong> {selectedStep.required_action}</p>
            <input type="file" onChange={(event) => handleFileChange(testSteps.indexOf(selectedStep), event)} />
            {selectedStep.files?.length > 0 ? (
              selectedStep.files.map((file, fileIndex) => (
                <div key={fileIndex}>
                  <p><strong>File:</strong> {file.file_testcase_name}</p>
                  <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                    <button className="download-btn">Download</button>
                  </a>
                </div>
              ))
            ) : (
              <p>No file uploaded.</p>
            )}
            <button className="close-btn" onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestExecution;