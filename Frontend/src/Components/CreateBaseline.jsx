import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import "./CSS/CreateBaseline.css";

const CreateBaseline = () => {
  const [validatedRequirements, setValidatedRequirements] = useState([]);
  const [selectedRequirements, setSelectedRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get("project_id");
  const navigate = useNavigate();

  // Fetch validated requirements
  useEffect(() => {
    const fetchRequirements = async () => {
      if (!projectId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          `http://localhost:3001/project/${projectId}/requirement`,
          { params: { status: "VALIDATED" } }
        );

        const validated = response.data.filter(
          (req) => req.requirement_status === "VALIDATED"
        );

        setValidatedRequirements(validated);
      } catch {
        setError("Failed to load requirements. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequirements();
  }, [projectId]);

  const handleSelect = (id) => {
    setSelectedRequirements((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id]
    );
  };

  const handleCreateBaseline = async () => {
    if (!projectId) {
      toast.error("Invalid project ID.");
      return;
    }

    if (selectedRequirements.length === 0) {
      toast.warning("Please select at least one requirement.");
      return;
    }

    if (isSubmitting) {
      toast.warning("Submitting in progress. Please wait.");
      return;
    }

    setIsSubmitting(true);

    const baselineAt = new Date().toISOString();

    const payload = {
      requirement_id: selectedRequirements,
      baseline_at: baselineAt,
    };

    try {
      const response = await axios.post(
        "http://localhost:3001/createbaseline",
        payload
      );

      if (response.status === 201) {
        const result = response.data;

        toast.success("Baseline set successfully!");

        // Step 1: Update requirement status to 'BASELINE'
        const updatePayload = {
          requirement_id: selectedRequirements,
          requirement_status: `BASELINE`,
        };

        await axios.post("http://localhost:3001/updaterequirements", updatePayload);

        // Step 2: Record history for each requirement in historyReqWorking with "BASELINE" status
        for (const requirementId of selectedRequirements) {
          const historyReqData = {
            requirement_id: requirementId,
            requirement_status: "BASELINE",  // Set status to "BASELINE"
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

        // Step 3: Filter out processed requirements and clear selection
        setValidatedRequirements((prev) =>
          prev.filter((req) => !selectedRequirements.includes(req.requirement_id))
        );
        setSelectedRequirements([]);

        console.log("Baseline and requirement statuses updated successfully.");
      } else {
        throw new Error(response.data.message || "Failed to set baseline.");
      }
    } catch (error) {
      console.error("Error creating baseline:", error.response?.data || error.message);
      const errorMessage =
        error.response?.data?.message || "An error occurred. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }

    navigate(`/Baseline?project_id=${projectId}`);
  };




  const handleCancel = () => {
    navigate(`/Baseline?project_id=${projectId}`);
  };

  return (
    <div className="baseline-container">
      <h1 className="baseline-title">Set Baseline</h1>
      <div className="baseline-content">
        <div className="baseline-left-panel">
          <h2 className="baseline-section-title">Requirements</h2>
          {loading ? (
            <p className="baseline-loading-message">Loading requirements...</p>
          ) : error ? (
            <p className="baseline-error-message">{error}</p>
          ) : validatedRequirements.length === 0 ? (
            <p className="baseline-no-data">No validated requirements found.</p>
          ) : (
            <table className="baseline-requirements-table">
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
                {validatedRequirements.map((req) => (
                  <tr key={req.requirement_id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRequirements.includes(req.requirement_id)}
                        onChange={() => handleSelect(req.requirement_id)}
                      />
                    </td>
                    <td>REQ-{req.requirement_id}</td>
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

      <div className="baseline-action-buttons">
        <button
          className="baseline-create-button"
          onClick={handleCreateBaseline}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Set Baseline"}
        </button>
        <button className="baseline-btn-cancel" onClick={handleCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default CreateBaseline;
