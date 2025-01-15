import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "./CSS/ReqVerification.css";

const ReqVerification = () => {
  const location = useLocation(); // Use useLocation to get the state
  const { selectedRequirements, project_id } = location.state || {}; // Get selectedRequirements and project_id from state

  const [reqcriList, setReqcriList] = useState([]); // For checklist items
  const [requirementsDetails, setRequirementsDetails] = useState([]); // For detailed requirements
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedRequirements && selectedRequirements.length > 0) {
      fetchRequirementsDetails(selectedRequirements);
    }
    fetchCriteria();
  }, [selectedRequirements]);

  // Fetch Criteria List (checklist data)
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

  // Fetch Requirements Details based on selectedRequirements
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

      <div className="flex-container">
        {/* Checklist Section */}
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

        {/* Comment Section */}
        <div className="box">
          <h2>Comment</h2>
          <textarea className="textarea" placeholder="Add your comment here..." />
        </div>
      </div>

      {/* Requirements Section */}
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

      {/* Save Button */}
      <div className="button-container">
        <button className="save-button">Save</button>
      </div>
    </div>
  );
};

export default ReqVerification;
