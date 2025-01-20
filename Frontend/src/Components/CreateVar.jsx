import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import "./CSS/CreateVar.css";

const CreateVar = () => {
    const [verifiedRequirements, setVerifiedRequirements] = useState([]);
    const [selectedRequirements, setSelectedRequirements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requirementsError, setRequirementsError] = useState(null);

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

    const handleSelect = (id) => {
        setSelectedRequirements((prev) =>
            prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
        );
    };

    const handleCreateVar = async () => {
        if (selectedRequirements.length === 0) {
            toast.warning("Please select at least one requirement.");
            return;
        }

        const user = JSON.parse(localStorage.getItem("user"));

        // สร้าง payload ในรูปแบบที่ต้องการ
        const payload = selectedRequirements.map((requirementId) => ({
            validation_id: null, // หรือค่าเริ่มต้นที่ต้องการ
            create_by: user?.username,
            requirement_id: requirementId,
            validation_at: new Date().toISOString(),
            validation_status: "WAITING FOR VALIDATION",
        }));

        console.log("Payload being sent to API:", payload);

        setIsSubmitting(true);

        try {
            const response = await axios.post("http://localhost:3001/createvar", payload);
            if (response.status === 201) {
                toast.success("Validation created successfully!");
                setVerifiedRequirements((prev) =>
                    prev.filter((req) => !selectedRequirements.includes(req.requirement_id))
                );
                setSelectedRequirements([]);
            } else {
                toast.error(response.data.message || "Failed to create validation.");
            }
        } catch (error) {
            console.error("Error creating validation(s):", error);
            toast.error(error.response?.data?.message || "An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };




    const handleCancel = () => {
        navigate(`/Dashboard?project_id=${projectId}`);
    };

    return (
        <div className="create-variable-container">
            <h1>Create Validation</h1>
            <div className="content">
                <div className="left-panel">
                    <h2>Verified Requirements</h2>
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

            <div className="action-buttons">
                <button
                    className="btn-create"
                    onClick={handleCreateVar}
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