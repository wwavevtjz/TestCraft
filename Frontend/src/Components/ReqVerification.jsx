import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "./CSS/ReqVerification.css";

const ReqVerification = () => {
  const location = useLocation();
  const { selectedRequirements } = location.state || { selectedRequirements: [] };

  const [reqcriList, setReqcriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCriteria, setNewCriteria] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [showPopup, setShowPopup] = useState(false); // State สำหรับจัดการ Popup
  const [isAllChecked, setIsAllChecked] = useState(false); // State เช็คว่า Checklist ครบหรือไม่
  const [showBackButton, setShowBackButton] = useState(false); // State สำหรับการแสดงปุ่มย้อนกลับ

  useEffect(() => {
    fetchCriteria();
  }, []);

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
      // ส่งข้อมูล Criteria ใหม่ไปที่ Backend
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
      alert("กรุณากรอกค่าที่ต้องการแก้ไข"); // ถ้าผู้ใช้ไม่ได้กรอกอะไร แจ้งเตือน
      return;
    }
    try {
      // อัปเดตข้อมูลใน Backend
      await axios.put(`http://localhost:3001/reqcriteria/${editingId}`, { reqcri_name: editValue });
      setEditingId(null);
      setEditValue("");
      fetchCriteria();
    } catch (error) {
      console.error("มีปัญหาในการอัปเดต Criteria:", error);
    }
  };

  // ฟังก์ชันสำหรับลบ Criteria
  const handleDelete = async (id) => {
    if (!window.confirm("คุณแน่ใจหรือว่าต้องการลบ Criteria นี้?")) return;
    try {
      await axios.delete(`http://localhost:3001/reqcriteria/${id}`);
      fetchCriteria(); // ดึงข้อมูลใหม่มาแสดง
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
  const handleVerify = () => {
    checkAllSelected();
    if (isAllChecked) {
      setShowPopup(true); // เปิด Popup เมื่อเลือกครบ
    } else {
      setShowPopup(true); // แสดง Popup แจ้งเตือนว่าไม่เลือกครบ
      setShowBackButton(true); // แสดงปุ่มย้อนกลับ
    }
  };

  // ฟังก์ชันยืนยันการ Verify
  const confirmVerify = () => {
    alert("ดำเนินการ Verify เรียบร้อย!");
    setShowPopup(false); // ปิด Popup
  };

  const handleBack = () => {
    setShowPopup(false); // ปิด Popup
    setShowBackButton(false); // ซ่อนปุ่มย้อนกลับ
  };

  return (
    <div className="req-verification-container">
      {/* ส่วนหัว */}
      <div className="header">
        <h1>Requirement Specification Verification Criteria</h1>
        <button className="verify-button" onClick={handleVerify}>
          Verify
        </button>
      </div>

      <div className="content">
        {/* ส่วน Checklist */}
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
                        onChange={(e) => setEditValue(e.target.value)} // เก็บค่าที่กำลังแก้ไข
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

        {/* ส่วน Requirements */}
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

        {/* ส่วน Members */}
        <div className="members-section">
          <h2>Member</h2>
          <p>ส่วนนี้สำหรับสมาชิกที่รับผิดชอบการตรวจสอบ</p>
        </div>
      </div>

      {/* Popup การแจ้งเตือน */}
      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            <p>
              {isAllChecked
                ? "ยืนยันที่จะ Verify ใช่มั้ย เพราะจะกลับมาแก้ไม่ได้แล้ว"
                : "กรุณาเลือก Checklist ที่ต้องการ Verify ก่อน"}
            </p>
            
              <button onClick={confirmVerify}>Save</button>
              <button onClick={handleBack}>Cancel</button>
            </div>
          </div>
      )}
    </div>
  );
};

export default ReqVerification;
