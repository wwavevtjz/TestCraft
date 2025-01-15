import React, { useState, useEffect } from "react";
import axios from "axios";
import "./CSS/ReqVerification.css";

const ReqVerification = () => {
  const [reqcriList, setReqcriList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCriteria();
  }, []);

  // Fetch Criteria List
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

 const fetchRequirement = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3001/verification");
      setReqcriList(response.data);
    } catch (error) {
      console.error("Error fetching criteria:", error);
    } finally {
      setLoading(false);
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
          <textarea
            className="textarea"
            placeholder="Add your comment here..."
          />
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
            {/* Example empty rows */}
            <tr>
              <td> </td>
              <td> </td>
              <td> </td>
            </tr>
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
