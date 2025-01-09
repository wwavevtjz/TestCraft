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
  const [selectedRequirementIds, setSelectedRequirementIds] = useState([]);

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

      // ตรวจสอบว่า requirement_status เป็น "WORKING" หรือไม่
      const updatedList = criteriaList.map((criteria) => {
        // ถ้า requirement_status เป็น WORKING ให้ isChecked เป็น false
        const isWorking = criteria.requirement_status === "WORKING";
        return {
          ...criteria,
          isChecked: isWorking ? false : savedCheckboxState[criteria.reqcri_id] || false, // ถ้าเป็น WORKING จะตั้งค่าเป็น false
        };
      });

      setReqcriList(updatedList); // ตั้งค่ารายการที่อัปเดต
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

    // บันทึกข้อมูลใน localStorage เฉพาะกรณีที่ requirement_status ไม่ใช่ "WORKING"
    const updatedCheckboxState = updatedList.reduce((acc, criteria) => {
      if (criteria.requirement_status !== "WORKING") {
        acc[criteria.reqcri_id] = criteria.isChecked;
      }
      return acc;
    }, {});
    localStorage.setItem("checkboxState", JSON.stringify(updatedCheckboxState)); // บันทึกสถานะใหม่ใน localStorage
  };



  const handleVerify = async () => {
    const idsToVerify = selectedRequirements.map(req => req.requirement_id);
    setSelectedRequirementIds(idsToVerify);
    setShowModal(true);
  };

  const handleBack = (e) => {
    e.stopPropagation(); // ป้องกันการกระทำซ้อน
    setShowModal(false);
  };


  const confirmVerify = async () => {
    if (projectId) {
      try {
        // ตรวจสอบว่า checkbox ทั้งหมดถูกเลือกหรือไม่
        const allChecked = reqcriList.every((criteria) => criteria.isChecked === true);

        const updatedRequirements = selectedRequirements.map((requirement) => ({
          ...requirement,
          requirement_status: allChecked ? 'VERIFIED' : 'VERIFY NOT COMPLETE', // ถ้าทุก checkbox ถูกเลือกให้เป็น VERIFIED
        }));

        // อัปเดตสถานะ requirements
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
                    <td>{requirement.requirement_type}</td>
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
          <div className="modal-verify-back" onClick={handleBack}></div>
          <div className="modal-verify">
            <div className="modal-content-verify">
              <p style={{ fontSize: "20px" }}>ยืนยันที่จะ Verify ข้อมูลเหล่านี้ใช่มั้ย</p>
              <table style={{ margin: "10px auto", borderCollapse: "collapse", width: "80%" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid " }} >
                    <th style={{ padding: "8px", textAlign: "center" }}>ID</th>
                    <th style={{ padding: "8px", textAlign: "center" }}>Requirement ID</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRequirementIds.map((id, index) => (
                    <tr key={id} style={{ borderBottom: "1px solid #ddd" }}>
                      <td style={{ padding: "8px" }}>{index + 1}</td>
                      <td style={{ padding: "8px" }}>REQ-00{id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={confirmVerify} style={{ marginRight: "10px" }}>Save</button>
              <button onClick={handleBack}>Cancel</button>
            </div>
          </div>
        </>
      )}


    </div>
  );
};

export default ReqVerification;
