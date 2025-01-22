import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Comment from "./Comment";
import "./CSS/ReqVerification.css";

const ReqVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get("project_id");
  const verificationId = queryParams.get("verification_id");
  const [toastShown, setToastShown] = useState(false);
  const { selectedRequirements } = location.state || {};
  const [reqcriList, setReqcriList] = useState([]);
  const [requirementsDetails, setRequirementsDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkboxState, setCheckboxState] = useState({});
  const [isReviewer, setIsReviewer] = useState(false);

  const localStorageKey = `checkboxState_${projectId}_${verificationId}`;

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
    checkReviewerStatus();

    const savedCheckboxState = localStorage.getItem(localStorageKey);
    if (savedCheckboxState) {
      setCheckboxState(JSON.parse(savedCheckboxState));
    }
  }, [projectId, verificationId, selectedRequirements, navigate]);

  useEffect(() => {
    return () => {
      setToastShown(false);
    };
  }, []);

  const fetchCriteria = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3001/reqcriteria");
      const initialCheckboxState = response.data.reduce((acc, criteria) => {
        acc[criteria.reqcri_id] = false;
        return acc;
      }, {});
      setReqcriList(response.data);
      const savedCheckboxState = localStorage.getItem(localStorageKey);
      if (savedCheckboxState) {
        setCheckboxState({
          ...initialCheckboxState,
          ...JSON.parse(savedCheckboxState),
        });
      } else {
        setCheckboxState(initialCheckboxState);
      }
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
    const storedUsername = localStorage.getItem("username");
    if (!storedUsername) {
      alert("Please log in first.");
      return;
    }

    try {
      const response = await axios.get("http://localhost:3001/verifications", {
        params: { project_id: projectId, verification_id: verificationId },
      });

      const verification = response.data.find((v) => v.id === parseInt(verificationId));
      if (verification && verification.verification_by.includes(storedUsername)) {
        setIsReviewer(true);
      } else {
        setIsReviewer(false);
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

    localStorage.setItem(localStorageKey, JSON.stringify(updatedState));
  };

  const handleSave = async () => {
    if (!isReviewer) {
      alert("You are not authorized to verify this requirement.");
      return;
    }
  
    const allChecked = Object.values(checkboxState).every((value) => value);
    if (!allChecked) {
      // Dismiss any existing toast before showing new one
      toast.dismiss();
  
      if (!toastShown) {
        toast.success("Criteria Checklist Save", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
  
        setToastShown(true); 
        
        setTimeout(() => {
          toast.dismiss(); 
          navigate(`/Dashboard?project_id=${projectId}`);
        }, 1500); // Wait for the toast autoClose to trigger before navigating
        return;
      }
    }
  
    // The rest of your code logic...
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
          <Comment verificationId={verificationId} />
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
