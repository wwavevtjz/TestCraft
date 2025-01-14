import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";
import "./CSS/CreateVeri.css";

const CreateVeri = () => {
  const [workingRequirements, setWorkingRequirements] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedRequirements, setSelectedRequirements] = useState([]);
  const [selectedReviewers, setSelectedReviewers] = useState({});
  const [loading, setLoading] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get("project_id");

  // Fetch working requirements
  useEffect(() => {
    if (projectId) {
      setLoading(true);
      axios
        .get(`http://localhost:3001/project/${projectId}/requirement`)
        .then((res) => {
          const working = res.data.filter(
            (requirement) => requirement.requirement_status === "WORKING"
          );
          setWorkingRequirements(working);
          setLoading(false);
        })
        .catch(() => {
          setError("Failed to load requirements. Please try again.");
          setLoading(false);
        });
    }
  }, [projectId]);

  // Fetch project members
  useEffect(() => {
    if (projectId) {
      setIsLoadingMembers(true);
      axios
        .get(`http://localhost:3001/projectname?project_id=${projectId}`)
        .then((res) => {
          if (Array.isArray(res.data)) {
            setMembers(res.data);
          } else {
            setError("Invalid project member data.");
          }
          setIsLoadingMembers(false);
        })
        .catch(() => {
          setError("Failed to load project members.");
          setIsLoadingMembers(false);
        });
    }
  }, [projectId]);

  // Generalized handle select for requirements
  const handleSelect = (id, setter, selectedList) => {
    setter((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  // Handle checkbox for reviewers
  const handleCheckboxReviewer = (memberName) => {
    setSelectedReviewers((prevState) => ({
      ...prevState,
      [memberName]: !prevState[memberName],
    }));
  };

  // Handle create verification
  const handleCreateVerification = () => {
    const selectedReviewerNames = Object.keys(selectedReviewers).filter(
      (name) => selectedReviewers[name]
    );

    if (selectedRequirements.length === 0 || selectedReviewerNames.length === 0) {
      toast.warning("Please select at least one requirement and one reviewer.");
      return;
    }

    const payload = {
      requirements: [...new Set(selectedRequirements)],
      reviewers: selectedReviewerNames,
    };

    // Perform API call with the payload here (e.g., axios.post(...))
    console.log("Payload for creation:", payload);
  };

  // Handle cancel
  const handleCancel = () => {
    setSelectedRequirements([]);
    setSelectedReviewers({});
    toast.info("Cancelled the selection.");
  };

  return (
    <div className="create-verification-container">
      <h1>Create Verification</h1>
      <div className="content">
        {/* Left Panel (Requirements Section) */}
        <div className="left-panel">
          <h2>Requirements</h2>
          {loading ? (
            <p>Loading requirements...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : workingRequirements.length === 0 ? (
            <p>No requirements found in 'WORKING' status.</p>
          ) : (
            <table className="requirements-table">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {workingRequirements.map((req) => (
                  <tr key={req.requirement_id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRequirements.includes(req.requirement_id)}
                        onChange={() =>
                          handleSelect(
                            req.requirement_id,
                            setSelectedRequirements,
                            selectedRequirements
                          )
                        }
                      />
                    </td>
                    <td>REQ-0{req.requirement_id}</td>
                    <td>{req.requirement_name}</td>
                    <td>{req.requirement_type}</td>
                    <td>{req.requirement_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right Panel (Reviewers Section) */}
        <div className="right-panel">
          <h2>Reviewers</h2>
          {isLoadingMembers ? (
            <p>Loading reviewers...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : members.length === 0 ? (
            <p>No reviewers found.</p>
          ) : (
            members.map((member, index) => {
              const memberInfo = member.project_member
                ? JSON.parse(member.project_member)
                : [];

              return (
                <div key={index}>
                  {memberInfo.map((info, roleIndex) => (
                    <div key={roleIndex}>
                      <input
                        type="checkbox"
                        id={info.name}
                        checked={selectedReviewers[info.name] || false}
                        onChange={() => handleCheckboxReviewer(info.name)}
                      />
                      <label htmlFor={info.name}>
                        <strong>{info.name}</strong>: <span>{info.roles}</span>
                      </label>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="btn-create" onClick={handleCreateVerification}>
          Create
        </button>
        <button className="btn-cancel" onClick={handleCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default CreateVeri;
