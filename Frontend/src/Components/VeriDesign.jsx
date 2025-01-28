import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import "./CSS/VeriDesign.css";
import closeModalIcon from "../image/close.png";
import notVerifiedIcon from "../image/notverify.png";
import verifiedIcon from "../image/verifydone.png";

const Modal = ({ show, onClose, details = {}, assignedReviewers = [] }) => {
    if (!show) return null;

    // แปลงข้อมูล assignedReviewers จาก ["Name: value"] เป็น { name, value }
    const parsedReviewers = assignedReviewers.map((entry) => {
        const [name, value] = entry.split(": ");
        return { name, value: value === "true" };
    });

    return (
        <div className="modal-overlay-review">
            <div className="modal-content-review">
                <h3>Design Details</h3>
                <div>
                    <p><strong>Design ID:</strong> {details.design_id}</p>
                    <p><strong>Design Name:</strong> {details.design_name}</p>
                    <p><strong>Created By:</strong> {details.created_by}</p>
                </div>

                <h3>Reviewers</h3>
                {parsedReviewers.length > 0 ? (
                    parsedReviewers.map((reviewer, index) => (
                        <div className="list-reviewer" key={index}>
                            <span>{reviewer.name}</span>
                            <img
                                src={reviewer.value ? verifiedIcon : notVerifiedIcon}
                                alt={reviewer.value ? "Verified" : "Not Verified"}
                                className="verification-status-icon"
                            />
                        </div>
                    ))
                ) : (
                    <div>No reviewers assigned yet.</div>
                )}

                <button className="close-modal-review-button" onClick={onClose}>
                    <img src={closeModalIcon} alt="Close" className="closemodalreview" />
                </button>
            </div>
        </div>
    );
};

const VeriDesign = () => {
    const [designs, setDesigns] = useState([]);
    const [selectedDetails, setSelectedDetails] = useState({});
    const [assignedReviewers, setAssignedReviewers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const projectId = queryParams.get("project_id");

    const fetchDesigns = useCallback(() => {
        axios
            .get(`http://localhost:3001/verilistdesign?project_id=${projectId}`)
            .then((response) => {
                const filteredDesigns = response.data.filter(
                    (design) => design.design_status === "WAITING FOR VERIFICATION"
                );
                setDesigns(filteredDesigns);
            })
            .catch((err) => {
                console.error("Error fetching designs:", err);
                toast.error("Error fetching designs.");
            });
    }, [projectId]);

    useEffect(() => {
        fetchDesigns();
    }, [fetchDesigns]);

    const handleSearchClick = (details, reviewers) => {
        setSelectedDetails(details || {});
        setAssignedReviewers(reviewers || []);
        setShowModal(true);
    };

    const handleVerifyClick = (designId) => {
        if (!projectId) {
            toast.error("Invalid project ID.");
            return;
        }

        const storedUsername = localStorage.getItem("username");
        if (!storedUsername) {
            toast.error("No user found. Please log in.");
            return;
        }

        navigate(`/DesignVerifed?project_id=${projectId}&design_id=${designId}`, {
            state: { design_id: designId, project_id: projectId },
        });
    };

    const closeModal = () => setShowModal(false);

    return (
        <div className="design-list-container">
            <h1>Design List</h1>
            {designs.length === 0 ? (
                <p>No designs available.</p>
            ) : (
                <table className="design-table">
                    <thead>
                        <tr>
                            <th>Design ID</th>
                            <th>Design Name</th>
                            <th>Created By</th>
                            <th>Date Created</th>
                            <th>Status</th>
                            <th>Reviewers</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {designs.map((design) => (
                            <tr key={design.design_id}>
                                <td>{design.design_id}</td>
                                <td>{design.diagram_name}</td>
                                <td>{design.created_by}</td>
                                <td>{new Date(design.created_at).toLocaleDateString()}</td>
                                <td>{design.design_status || " "}</td>
                                <td>
                                    <button
                                        className="search-icon-button"
                                        title="View Reviewers"
                                        onClick={() =>
                                            handleSearchClick(
                                                { design_id: design.design_id, ...design },
                                                design.assigned_reviewers || []
                                            )
                                        }
                                    >
                                        🔍
                                    </button>
                                </td>
                                <td>
                                    <button
                                        className="verify-button"
                                        onClick={() => handleVerifyClick(design.design_id)}
                                    >
                                        Verify
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <Modal
                show={showModal}
                onClose={closeModal}
                details={selectedDetails}
                assignedReviewers={assignedReviewers}
            />
        </div>
    );
};

export default VeriDesign;
