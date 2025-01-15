import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./CSS/ReqVerification.css";

const ReqVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedRequirements, project_id } = location.state || {};

  const [reqcriList, setReqcriList] = useState([]);
  const [requirementsDetails, setRequirementsDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkboxState, setCheckboxState] = useState({}); // เก็บสถานะของ checkbox
  const [allChecked, setAllChecked] = useState(false); // เช็คว่าทุก checkbox ถูกเลือกหรือไม่

  useEffect(() => {
    if (!project_id) {
      console.error("Project ID is missing or undefined");
      navigate("/VerificationList");
      return;
    }

    if (selectedRequirements && selectedRequirements.length > 0) {
      fetchRequirementsDetails(selectedRequirements);
    }

    fetchCriteria();
  }, [project_id, selectedRequirements, navigate]);

  const fetchCriteria = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3001/reqcriteria");
      const initialCheckboxState = response.data.reduce((acc, criteria) => {
        acc[criteria.reqcri_id] = false; // ตั้งค่า checkbox ทุกตัวเริ่มต้นเป็น false
        return acc;
      }, {});
      setCheckboxState(initialCheckboxState);
      setReqcriList(response.data);
    } catch (error) {
      console.error("Error fetching criteria:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequirementsDetails = async (requirements) => {
    try {
      const response = await axios.get("http://localhost:3001/requirements", {
        params: { requirement_ids: requirements },
      });
      setRequirementsDetails(response.data);
    } catch (error) {
      console.error("Error fetching requirements:", error);
    }
  };

  const handleCheckboxChange = (id) => {
    const updatedState = {
      ...checkboxState,
      [id]: !checkboxState[id],
    };
    setCheckboxState(updatedState);
  
    // ตรวจสอบสถานะ checkbox ทุกตัว
    const isAllChecked = Object.values(updatedState).every((isChecked) => isChecked);
    setAllChecked(isAllChecked);
  };
  

  const handleSave = async () => {
  if (allChecked) {
    if (!project_id) {
      alert("Project ID is missing. Cannot update status.");
      return;
    }

    try {
      // ส่งค่าที่ Backend ต้องการ
      const response = await axios.put(`http://localhost:3001/update-status-verifications`, {
        verification_status: "VERIFIED", // สถานะที่จะอัปเดต
      });

      if (response.status === 200) {
        alert("Status updated to VERIFIED successfully.");
      } else {
        alert("Unexpected response from server.");
      }
    } catch (error) {
      console.error("Error updating status:", error.response || error.message);
      alert("Failed to update status.");
    }
  } else {
    alert("Please select all checkboxes before saving.");
  }
};



  return (
    <div className="container">
      <h1 className="title">Verification Requirement</h1>

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
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={checkboxState[criteria.reqcri_id] || false}
                      onChange={() => handleCheckboxChange(criteria.reqcri_id)}
                    />
                    {criteria.reqcri_name}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="box">
          <h2>Comment</h2>
          <textarea className="textarea" placeholder="Add your comment here..." />
        </div>
      </div>

      <div className="box requirements">
        <h2>Requirement</h2>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Requirements Statement</th>
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

      <div className="button-container">
        <button className="save-button" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
};

export default ReqVerification;
