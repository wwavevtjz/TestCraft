import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import "./CSS/CreateVar.css";

const CreateVar = () => {
  const [verifiedRequirements, setVerifiedRequirements] = useState([]);
  const [selectedRequirements, setSelectedRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requirementsError, setRequirementsError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastId, setToastId] = useState(null);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get("project_id");
  const navigate = useNavigate();

  // Fetch verified requirements
  useEffect(() => {
    if (projectId) {
      setLoading(true);
      axios
        .get(`http://localhost:3001/project/${projectId}/requirement`)
        .then((res) => {
          const verified = res.data.filter(
            (requirement) => requirement.requirement_status === "VERIFIED"
          );
          setVerifiedRequirements(verified);
          setRequirementsError(null);
        })
        .catch(() => {
          setRequirementsError("Failed to load requirements. Please try again.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [projectId]);

  // Generalized handle select for requirements
  const handleSelect = (id) => {
    setSelectedRequirements((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleCreateValidation = async () => {
    if (!projectId) {
      if (toastId) toast.dismiss(toastId);
      setToastId(toast.error("Invalid project ID."));
      return;
    }
  
    if (selectedRequirements.length === 0) {
      if (toastId) toast.dismiss(toastId);
      setToastId(toast.warning("Please select at least one requirement."));
      return;
    }
  
    const storedUsername = localStorage.getItem("username");
    const createBy = storedUsername;
  
    if (!createBy) {
      if (toastId) toast.dismiss(toastId);
      setToastId(toast.error("No user found. Please login again."));
      return;
    }
  
    const payload = {
      requirements: [...new Set(selectedRequirements)], // Unique requirements
      project_id: projectId,
      create_by: createBy,
    };
  
    if (isSubmitting) {
      if (toastId) toast.dismiss(toastId);
      setToastId(toast.warning("Submitting in progress. Please wait."));
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      const response = await axios.post("http://localhost:3001/createvalidation", payload);
  
      if (response.status === 201) {
        if (toastId) toast.dismiss(toastId);
        setToastId(toast.success("Validation created successfully!"));
  
        // Update frontend state
        setVerifiedRequirements((prev) =>
          prev.filter((req) => !selectedRequirements.includes(req.requirement_id))
        );
        setSelectedRequirements([]);
  
        // Loop through selected requirements and add them to history with status "WAITING FOR VALIDATION"
        for (const requirementId of selectedRequirements) {
          const historyReqData = {
            requirement_id: requirementId,
            requirement_status: "WAITING FOR VALIDATION",  // Set status to "WAITING FOR VALIDATION"
          };
  
          // Send to historyReqWorking
          const historyResponse = await axios.post(
            "http://localhost:3001/historyReqWorking",
            historyReqData
          );
  
          if (historyResponse.status !== 200) {
            console.error("Failed to add history for requirement:", requirementId);
          }
        }
  
      } else {
        if (toastId) toast.dismiss(toastId);
        setToastId(toast.error(response.data.message || "Failed to create validation."));
      }
    } catch (error) {
      console.error("Error creating validation:", error);
  
      const errorMessage =
        error.response?.data?.message || "An error occurred. Please try again.";
      if (toastId) toast.dismiss(toastId);
      setToastId(toast.error(errorMessage));
    } finally {
      setIsSubmitting(false);
    }
  };
  

  const handleCancel = () => {
    if (toastId) {
      toast.dismiss(toastId);
    }
    navigate(`/Dashboard?project_id=${projectId}`);
  };

  return (
    <div className="create-validation-container">
      <h1 className="createvar">Create Validation</h1>
      <div className="content">
        <div className="left-panel">
          <h2>Requirements</h2>
          {loading ? (
            <p>Loading requirements...</p>
          ) : requirementsError ? (
            <p className="error-message">{requirementsError}</p>
          ) : verifiedRequirements.length === 0 ? (
            <p>No requirements found in 'VERIFIED' status.</p>
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
                {verifiedRequirements.map((req) => (
                  <tr key={req.requirement_id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRequirements.includes(req.requirement_id)}
                        onChange={() => handleSelect(req.requirement_id)}
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
      </div>

      <div className="action-buttons">
        <button
          className="btn-create"
          onClick={handleCreateValidation}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create"}
        </button>
        <button className="btn-cancel" onClick={handleCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default CreateVar;