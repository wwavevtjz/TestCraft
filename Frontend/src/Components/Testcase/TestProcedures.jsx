import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faSave, faTrash, faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import "./testcase_css/TestProcedures.css";

const TestProcedures = () => {
  const [procedures, setProcedures] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStep, setNewStep] = useState({ required_action: "", expected_result: "", prerequisite: "" });
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const testcaseId = queryParams.get("testcase_id");

  useEffect(() => {
    fetchTestProcedures();
  }, [testcaseId]);

  const fetchTestProcedures = () => {
    if (!testcaseId) return;
    axios.get(`http://localhost:3001/api/test-procedures?testcase_id=${testcaseId}`)
      .then((response) => setProcedures(response.data))
      .catch((error) => console.error("Error fetching data:", error));
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewStep({ required_action: "", expected_result: "", prerequisite: "" });
  };

  const handleChange = (e) => {
    setNewStep({ ...newStep, [e.target.name]: e.target.value });
  };

  const handleSaveStep = () => {
    if (!testcaseId) return;
    axios.post("http://localhost:3001/api/test-procedures", {
      testcase_id: testcaseId,
      required_action: newStep.required_action,
      expected_result: newStep.expected_result,
      prerequisite: newStep.prerequisite
    })
    .then((response) => {
      setProcedures([...procedures, response.data]); // เพิ่มข้อมูลใหม่เข้าไปที่ตาราง
      handleCloseModal(); // ปิด Modal
    })
    .catch((error) => console.error("Error saving data:", error));
  };

  return (
    <div className="test-procedures-container">
      <div className="test-procedures-header">
        <h3>Test Procedures</h3>
        <button className="add-test-step-btn" onClick={handleOpenModal}>
          <FontAwesomeIcon icon={faPlus} /> Add Test Step
        </button>
      </div>

      <div className="table-wrapper">
        <table className="test-procedures-table">
          <thead>
            <tr>
              <th>Step No</th>
              <th>Required Action</th>
              <th>Expected Result</th>
              <th>Prerequisite</th>
            </tr>
          </thead>
          <tbody>
            {procedures.map((proc, index) => (
              <tr key={proc.test_procedures_id}>
                <td>{index + 1}</td>
                <td>{proc.required_action}</td>
                <td>{proc.expected_result}</td>
                <td>{proc.prerequisite}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close-btn" onClick={handleCloseModal}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <h3>Create Test Step</h3>
            <label>Required Action</label>
            <input type="text" name="required_action" value={newStep.required_action} onChange={handleChange} />

            <label>Expected Result</label>
            <input type="text" name="expected_result" value={newStep.expected_result} onChange={handleChange} />

            <label>Prerequisite</label>
            <input type="text" name="prerequisite" value={newStep.prerequisite} onChange={handleChange} />

            <button className="save-btn" onClick={handleSaveStep}>
              <FontAwesomeIcon icon={faSave} /> Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestProcedures;
