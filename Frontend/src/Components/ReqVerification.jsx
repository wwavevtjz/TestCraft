import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./CSS/ReqVerification.css";

const ReqVerification = () => {
  const location = useLocation(); // ใช้ useLocation เพื่อดึงข้อมูลจาก URL และ state
  const navigate = useNavigate(); // ใช้ navigate เพื่อกลับไปยังหน้าอื่นหากเกิดข้อผิดพลาด
  const { selectedRequirements, project_id } = location.state || {}; // ตรวจสอบว่า state มีค่าหรือไม่

  const [reqcriList, setReqcriList] = useState([]); // สำหรับข้อมูล checklist
  const [requirementsDetails, setRequirementsDetails] = useState([]); // สำหรับข้อมูลรายละเอียด requirements
  const [loading, setLoading] = useState(true); // สถานะการโหลดข้อมูล

  useEffect(() => {
    if (!project_id) {
      // หากไม่มี project_id ให้ทำการแสดงข้อผิดพลาดหรือ redirect ไปหน้าอื่น
      console.error("Project ID is missing or undefined");
      navigate("/VerificationList"); // redirect ไปหน้า VerificationList หากไม่มี project_id
      return; // หยุดการทำงาน
    }

    // ถ้ามี selectedRequirements ให้ดึงข้อมูลตามที่เลือก
    if (selectedRequirements && selectedRequirements.length > 0) {
      fetchRequirementsDetails(selectedRequirements);
    }

    fetchCriteria(); // ดึงข้อมูล criteria
  }, [project_id, selectedRequirements, navigate]);

  // ฟังก์ชันดึงข้อมูล Criteria (checklist)
  const fetchCriteria = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3001/reqcriteria");
      setReqcriList(response.data);
    } catch (error) {
      console.error("Error fetching criteria:", error);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันดึงข้อมูลรายละเอียดของ Requirements
  const fetchRequirementsDetails = async (requirements) => {
    try {
      const response = await axios.get("http://localhost:3001/requirements", {
        params: {
          requirement_ids: requirements, // ส่ง requirement_ids เป็น query parameter
        },
      });
      setRequirementsDetails(response.data);
    } catch (error) {
      console.error("Error fetching requirements:", error);
    }
  };

  return (
    <div className="container">
      <h1 className="title">Verification Requirements</h1>

      {/* แสดง Checklist Section */}
      <div className="flex-container">
        <div className="box">
          <h2>Checklist</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ul className="checklist">
              {reqcriList.map((criteria) => (
                <li key={criteria.reqcri_id}>
                  <label>
                    <input type="checkbox" className="checkbox" />
                    {criteria.reqcri_name}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* แสดง Comment Section */}
        <div className="box">
          <h2>Comment</h2>
          <textarea className="textarea" placeholder="Add your comment here..." />
        </div>
      </div>

      {/* แสดง Requirements Section */}
      <div className="box requirements">
        <h2>Requirements</h2>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Requirements Statements</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {requirementsDetails.length > 0 ? (
              requirementsDetails.map((req, index) => (
                <tr key={index}>
                  <td>REQ-0{req.requirement_id}</td>
                  <td>{req.requirement_name}</td>
                  <td>{req.requirement_type}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3">No requirements details found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ปุ่ม Save */}
      <div className="button-container">
        <button className="save-button">Save</button>
      </div>
    </div>
  );
};

export default ReqVerification;
