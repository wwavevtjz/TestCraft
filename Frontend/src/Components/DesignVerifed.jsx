import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Comment from "./Comment";
import "./CSS/DesignVerifed.css";

const DesignVerifed = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get("project_id");
  const designId = queryParams.get("design_id");
  const [criteriaList, setCriteriaList] = useState([]);
  const [designDetails, setDesignDetails] = useState({});
  const [checkboxState, setCheckboxState] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId || !designId) {
      console.error("Project ID or Design ID is missing.");
      navigate("/VeriDesign");
      return;
    }

    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      const storedCheckboxState = localStorage.getItem(
        `checkboxState_${storedUsername}_${projectId}_${designId}`
      );
      if (storedCheckboxState) {
        setCheckboxState(JSON.parse(storedCheckboxState));
      }
    }

    fetchDesignDetails();
    fetchCriteria();
  }, [projectId, designId, navigate]);

  const fetchCriteria = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3001/designcriteria");
      const initialCheckboxState = response.data.reduce((acc, criteria) => {
        acc[criteria.id] = false;
        return acc;
      }, {});
      setCriteriaList(response.data);

      const storedUsername = localStorage.getItem("username");
      if (storedUsername) {
        const storedCheckboxState = localStorage.getItem(
          `checkboxState_${storedUsername}_${projectId}_${designId}`
        );
        if (storedCheckboxState) {
          setCheckboxState(JSON.parse(storedCheckboxState));
        } else {
          setCheckboxState(initialCheckboxState);
        }
      }
    } catch (error) {
      console.error("Error fetching criteria:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDesignDetails = async () => {
    try {
      const response = await axios.get("http://localhost:3001/designs", {
        params: { design_id: designId },
      });
      setDesignDetails(response.data);
    } catch (error) {
      console.error("Error fetching design details:", error);
    }
  };

  const handleCheckboxChange = (id) => {
    const updatedState = {
      ...checkboxState,
      [id]: !checkboxState[id],
    };
    setCheckboxState(updatedState);

    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      localStorage.setItem(
        `checkboxState_${storedUsername}_${projectId}_${designId}`,
        JSON.stringify(updatedState)
      );
    }
  };

  const handleSave = async () => {
    const allChecked = Object.values(checkboxState).every((value) => value);

    if (!allChecked) {
      toast.success("Criteria Checklist Saved", {
        position: "top-right",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        onClose: () => navigate(`/VeriDesign?project_id=${projectId}`),
      });
      return;
    }

    try {
      const storedUsername = localStorage.getItem("username");
      if (!storedUsername) {
        alert("Please log in first.");
        return;
      }

      const response = await axios.get("http://localhost:3001/verifications", {
        params: { project_id: projectId, design_id: designId },
      });
      const verification = response.data.find((v) => v.design_id === parseInt(designId));

      if (verification) {
        const updatedVerificationBy = verification.verification_by.map((entry) => {
          const [username, status] = entry.split(":").map((item) => item.trim());
          if (username === storedUsername) {
            return `${username}: true`;
          }
          return entry;
        });

        await axios.put("http://localhost:3001/update-design-verification", {
          project_id: projectId,
          design_id: designId,
          verification_by: updatedVerificationBy,
        });

        const allVerified = updatedVerificationBy.every((entry) => {
          const [, status] = entry.split(":").map((item) => item.trim());
          return status === "true";
        });

        if (allVerified) {
          await axios.put("http://localhost:3001/update-design-status", {
            design_id: designId,
            design_status: "VERIFIED",
          });

          toast.success("Design verified and status updated!", {
            position: "top-right",
            autoClose: 1500,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            onClose: () => navigate(`/Dashboard?project_id=${projectId}`),
          });
        } else {
          toast.warning("Not all users have verified. Please wait for everyone to verify.", {
            position: "top-right",
            autoClose: 1800,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            onClose: () => navigate(`/VeriDesign?project_id=${projectId}`),
          });
        }
      }
    } catch (error) {
      console.error("Error updating verification status:", error);
      toast.error("Failed to update verification status. Please try again.", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  return (
    <div className="container">
      <h1 className="title">Design Verification</h1>

      <div className="flex-container">
        <div className="box">
          <h2>Checklist</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ul className="checklist">
              {criteriaList.map((criteria) => (
                <li key={criteria.id}>
                  <label>
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={checkboxState[criteria.id] || false}
                      onChange={() => handleCheckboxChange(criteria.id)}
                    />
                    {criteria.name}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="box">
          <Comment designId={designId} />
        </div>
      </div>

      <div className="box design-details">
        <h2>Design Details</h2>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Created By</th>
            </tr>
          </thead>
          <tbody>
            {designDetails ? (
              <tr>
                <td>{designDetails.design_id}</td>
                <td>{designDetails.design_name}</td>
                <td>{designDetails.created_by}</td>
              </tr>
            ) : (
              <tr>
                <td colSpan="3">No design details found</td>
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

export default DesignVerifed;
