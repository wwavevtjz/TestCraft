import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Comment from "./Comment";
import "./CSS/ReqVerification.css";

const ReqVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get("project_id");
  const verificationId = queryParams.get("verification_id");

  const { selectedRequirements } = location.state || {};
  const [reqcriList, setReqcriList] = useState([]);
  const [requirementsDetails, setRequirementsDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkboxState, setCheckboxState] = useState({});
  const [allChecked, setAllChecked] = useState(false);
  const [isReviewer, setIsReviewer] = useState(false); // เก็บสถานะว่าเป็น reviewer หรือไม่

  useEffect(() => {
    if (!projectId || !verificationId) {
      console.error("Project ID or Verification ID is missing");
      navigate("/VerificationList");
      return;
    }

    if (selectedRequirements && selectedRequirements.length > 0) {
      fetchRequirementsDetails(selectedRequirements);
    }

    fetchCriteria();
    checkReviewerStatus(); // ตรวจสอบว่า user เป็น reviewer หรือไม่
  }, [projectId, verificationId, selectedRequirements, navigate]);

  const fetchCriteria = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3001/reqcriteria");
      const initialCheckboxState = response.data.reduce((acc, criteria) => {
        acc[criteria.reqcri_id] = false;
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

  const checkReviewerStatus = async () => {
    const storedUsername = localStorage.getItem("username"); // ดึงชื่อผู้ใช้ที่ล็อกอิน
    if (!storedUsername) {
      alert("Please log in first.");
      return;
    }

    try {
      const response = await axios.get("http://localhost:3001/verifications", {
        params: { project_id: projectId, verification_id: verificationId },
      });

      const verification = response.data.find(v => v.id === parseInt(verificationId));
      if (verification && verification.verification_by.includes(storedUsername)) {
        setIsReviewer(true); // ถ้าเป็น reviewer
      } else {
        setIsReviewer(false); // ถ้าไม่ใช่ reviewer
      }
    } catch (error) {
      console.error("Error checking reviewer status:", error);
    }
  };

  const handleCheckboxChange = (id) => {
    const updatedState = {
      ...checkboxState,
      [id]: !checkboxState[id],
    };
    setCheckboxState(updatedState);

    const isAllChecked = Object.values(updatedState).every((isChecked) => isChecked);
    setAllChecked(isAllChecked);
  };

  const handleSave = async () => {
    if (!isReviewer) {
      alert("You are not authorized to verify this requirement.");
      return;
    }

    if (!allChecked) {
      alert("Please select all checkboxes before saving.");
      return;
    }

    if (!projectId || requirementsDetails.length === 0) {
      alert("Project ID or requirements details are missing. Cannot update status.");
      return;
    }

    try {
      const requirementIds = requirementsDetails.map((req) => req.requirement_id);

      await axios.put("http://localhost:3001/update-requirements-status-verified", {
        requirement_ids: requirementIds,
        requirement_status: "VERIFIED",
      });

      alert("Status updated to VERIFIED successfully.");
      navigate(`/Dashboard?project_id=${projectId}`);
    } catch (error) {
      console.error("Error updating status:", error.response || error.message);
      alert("Failed to update status.");
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
          <Comment verificationId={verificationId} />  {/* ส่ง verificationId ไปยัง Comment */}
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
