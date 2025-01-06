import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./CSS/ReqVerification.css";

const ReqVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedRequirements } = location.state || { selectedRequirements: [] };

  const [reqcriList, setReqcriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); // State สำหรับจัดการ Modal
  const [projectId, setProjectId] = useState(null);

  useEffect(() => {
    fetchCriteria();
    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get("project_id");
    if (id) setProjectId(id);
  }, [location]);

  const fetchCriteria = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3001/reqcriteria");
      const criteriaList = response.data;
      
      // Load saved checkbox state from localStorage
      const savedCheckboxState = JSON.parse(localStorage.getItem("checkboxState")) || {};
      const updatedList = criteriaList.map((criteria) => ({
        ...criteria,
        isChecked: savedCheckboxState[criteria.reqcri_id] || false,
      }));

      setReqcriList(updatedList);
    } catch (error) {
      console.error("มีปัญหาในการดึงข้อมูล:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (e, id) => {
    const updatedList = reqcriList.map((criteria) =>
      criteria.reqcri_id === id ? { ...criteria, isChecked: e.target.checked } : criteria
    );
    setReqcriList(updatedList);

    // Save the updated checkbox state to localStorage
    const updatedCheckboxState = updatedList.reduce((acc, criteria) => {
      acc[criteria.reqcri_id] = criteria.isChecked;
      return acc;
    }, {});
    localStorage.setItem("checkboxState", JSON.stringify(updatedCheckboxState));
  };

  const handleVerify = async () => {
    setShowModal(true);
  };

  const handleBack = () => {
    setShowModal(false);
  };

  const confirmVerify = async () => {
    if (projectId) {
      try {
        // ตรวจสอบว่า checkbox ทั้งหมดถูกเลือกหรือไม่
        const allChecked = reqcriList.every((criteria) => criteria.isChecked);

        const updatedRequirements = selectedRequirements.map((requirement) => ({
          ...requirement,
          requirement_status: allChecked ? 'VERIFIED' : 'VERIFY NOT COMPLETE',
        }));

        await Promise.all(
          updatedRequirements.map((requirement) =>
            axios.put(`http://localhost:3001/statusrequirement/${requirement.requirement_id}`, {
              requirement_status: requirement.requirement_status,
            })
          )
        );

        console.log("Requirements status updated successfully.");
        navigate(`/Dashboard?project_id=${projectId}`, { state: { selectedSection: 'Requirement' } });
      } catch (error) {
        console.error("มีปัญหาการอัปเดตสถานะของ Requirements:", error);
      }
    } else {
      console.error("Project ID is missing");
    }
    setShowModal(false);
  };

  return (
    <div className="req-verification-container">
      <div className="header">
        <h1>Requirement Specification Verification Criteria</h1>
        <button className="verify-button" onClick={handleVerify}>
          Verify
        </button>
      </div>

      <div className="content">
        <div className="checklist-section">
          <h2>Checklist</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ul>
              {reqcriList.map((criteria) => (
                <li key={criteria.reqcri_id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <label>
                    <input
                      type="checkbox"
                      checked={criteria.isChecked || false} // ใช้ค่า isChecked ที่เก็บจาก state
                      onChange={(e) => handleCheckboxChange(e, criteria.reqcri_id)}
                    />
                    {criteria.reqcri_name}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="requirements-section">
          <h2>Requirements</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Requirements Statements</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {selectedRequirements.length === 0 ? (
                <tr>
                  <td colSpan="3">No requirements selected for verification.</td>
                </tr>
              ) : (
                selectedRequirements.map((requirement) => (
                  <tr key={requirement.requirement_id}>
                    <td>REQ-00{requirement.requirement_id}</td>
                    <td>{requirement.requirement_name}</td>
                    <td>Type Placeholder</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="members-section">
          <h2>Member</h2>
          <p>ส่วนนี้สำหรับสมาชิกที่รับผิดชอบการตรวจสอบ</p>
        </div>
      </div>

      {showModal && (
        <>
          <div className="modal-overlay" onClick={handleBack}></div>
          <div className="modal">
            <div className="modal-content">
              <p>ยืนยันที่จะ Verify ใช่มั้ย</p>
              <button onClick={confirmVerify}>Save</button>
              <button onClick={handleBack}>Cancel</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReqVerification;
