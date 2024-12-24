import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // import useNavigate
import axios from "axios";
import "./CSS/ReqVerification.css";

const ReqVerification = () => {
  const location = useLocation();
  const navigate = useNavigate(); // initialize navigate
  const { selectedRequirements } = location.state || { selectedRequirements: [] };

  const [reqcriList, setReqcriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCriteria, setNewCriteria] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [showPopup, setShowPopup] = useState(false); // State สำหรับจัดการ Popup
  const [isAllChecked, setIsAllChecked] = useState(false); // State เช็คว่า Checklist ครบหรือไม่
  const [showBackButton, setShowBackButton] = useState(false); // State สำหรับการแสดงปุ่มย้อนกลับ
  const [projectId, setProjectId] = useState(null); // Project ID state (you should get it from the context or URL)

  useEffect(() => {
    fetchCriteria();
    // Getting projectId from query parameters (if any)
    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get("project_id");
    if (id) setProjectId(id); // Set projectId state from query string
  }, [location]);

  // ฟังก์ชันสำหรับดึงข้อมูล Checklist
  const fetchCriteria = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3001/reqcriteria");
      setReqcriList(response.data);
    } catch (error) {
      console.error("มีปัญหาในการดึงข้อมูล:", error);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันสำหรับเพิ่ม Criteria ใหม่
  const handleAdd = async () => {
    if (newCriteria.trim() === "") {
      alert("กรุณากรอกชื่อ Criteria ก่อน");
      return;
    }
    try {
      await axios.post("http://localhost:3001/reqcriteria", { reqcri_name: newCriteria });
      setNewCriteria("");
      fetchCriteria();
    } catch (error) {
      console.error("มีปัญหาในการเพิ่ม Criteria:", error);
    }
  };

  // ฟังก์ชันกดปุ่ม Edit
  const handleEdit = (id, currentValue) => {
    setEditingId(id);
    setEditValue(currentValue);
  };

  // ฟังก์ชันแก้ไข
  const handleUpdate = async () => {
    if (editValue.trim() === "") {
      alert("กรุณากรอกค่าที่ต้องการแก้ไข");
      return;
    }
    try {
      await axios.put(`http://localhost:3001/reqcriteria/${editingId}`, { reqcri_name: editValue });
      setEditingId(null);
      setEditValue("");
      fetchCriteria();
    } catch (error) {
      console.error("มีปัญหาการอัปเดต Criteria:", error);
    }
  };

  // ฟังก์ชันสำหรับลบ Criteria
  const handleDelete = async (id) => {
    if (!window.confirm("คุณแน่ใจหรือว่าต้องการลบ Criteria นี้?")) return;
    try {
      await axios.delete(`http://localhost:3001/reqcriteria/${id}`);
      fetchCriteria();
    } catch (error) {
      console.error("มีปัญหาในการลบ Criteria:", error);
    }
  };

  // ฟังก์ชันเช็คว่า Checklist ถูกเลือกครบหรือไม่
  const checkAllSelected = () => {
    const allChecked = reqcriList.every((criteria) => criteria.isChecked);
    setIsAllChecked(allChecked);
  };

  // ฟังก์ชันกดปุ่ม Verify
  const handleVerify = async () => {
    checkAllSelected();
    setShowPopup(true); // เปิด Popup
    setShowBackButton(!isAllChecked); // แสดงปุ่มย้อนกลับเมื่อยังไม่เลือกครบ

    // เมื่อกด Verify จะต้องอัปเดตสถานะของ Requirements ที่เลือกให้เป็น 'VERIFIED'
    try {
      const updatedRequirements = selectedRequirements.map((requirement) => ({
        ...requirement,
        requirement_status: 'VERIFIED' // ตั้งค่า status เป็น 'VERIFIED'
      }));

      // Update each requirement status to VERIFIED
      await Promise.all(
        updatedRequirements.map((requirement) =>
          axios.put(`http://localhost:3001/requirement/${requirement.requirement_id}`, { requirement_status: 'VERIFIED' })
        )
      );
      // หลังจากอัปเดตสำเร็จ, รีเฟรชรายการ Criteria หรือ Requirements
      fetchCriteria(); // รีเฟรชรายการ Criteria
    } catch (error) {
      console.error("มีปัญหาการอัปเดตสถานะของ Requirements:", error);
    }
  };

  const handleBack = () => {
    setShowPopup(false); // ปิด Popup
    setShowBackButton(false); // ซ่อนปุ่มย้อนกลับ
  };

  // ฟังก์ชันยืนยันการ Verify
  const confirmVerify = () => {
    // Ensure projectId is set
    if (projectId) {
      navigate(`/Dashboard?project_id=${projectId}`, { state: { selectedSection: 'Requirement' } });
    } else {
      console.error("Project ID is missing");
    }
    setShowPopup(false); // ปิด Popup
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
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <input
              type="text"
              value={newCriteria}
              onChange={(e) => setNewCriteria(e.target.value)}
              placeholder="Add New Criteria"
            />
            <button className="add-button" onClick={handleAdd}>
              Add
            </button>
          </div>
          {loading ? (
            <p>Loading........</p>
          ) : (
            <ul>
              {reqcriList.map((criteria) => (
                <li key={criteria.reqcri_id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {editingId === criteria.reqcri_id ? (
                    <>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                      />
                      <button onClick={handleUpdate}>Save</button>
                      <button onClick={() => setEditingId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <label>
                        <input
                          type="checkbox"
                          checked={criteria.isChecked || false}
                          onChange={(e) => {
                            const updatedList = reqcriList.map((item) =>
                              item.reqcri_id === criteria.reqcri_id
                                ? { ...item, isChecked: e.target.checked }
                                : item
                            );
                            setReqcriList(updatedList);
                          }}
                        />
                        {criteria.reqcri_name}
                      </label>
                      <button onClick={() => handleEdit(criteria.reqcri_id, criteria.reqcri_name)}>Edit</button>
                      <button onClick={() => handleDelete(criteria.reqcri_id)}>Delete</button>
                    </>
                  )}
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

      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            <p>{isAllChecked ? "ยืนยันที่จะ Verify ใช่มั้ย เพราะจะกลับมาแก้ไม่ได้แล้ว" : "กรุณาเลือก Checklist ที่ต้องการ Verify ก่อน"}</p>
            {isAllChecked ? (
              <>
                <button onClick={confirmVerify}>Save</button>
                <button onClick={handleBack}>Cancel</button>
              </>
            ) : (
              <button onClick={handleBack}>OK</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReqVerification;
