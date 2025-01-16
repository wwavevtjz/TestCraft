import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./CSS/VerificationList.css";

// Modal Component
const Modal = ({ show, onClose, reviewers }) => {
    if (!show) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Reviewers</h2>
                {reviewers && reviewers.length > 0 ? (
                    reviewers.map((reviewer, index) => (
                        <div key={index}>
                            <p>{reviewer}</p>
                            <hr />
                        </div>
                    ))
                ) : (
                    <p>No reviewers found.</p>
                )}
                <button className="close-modal-button" onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    );
};

const VerificationList = () => {
    const [verifications, setVerifications] = useState([]);
    const [selectedReviewers, setSelectedReviewers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const projectId = queryParams.get("project_id");
    const currentUsername = localStorage.getItem("username");

    // Fetch verifications
    useEffect(() => {
        axios
            .get(`http://localhost:3001/verifications?project_id=${projectId}`)
            .then((response) => {
                let filteredVerifications = response.data;

                // Filter verifications for non-admin users
                if (currentUsername !== "admin") {
                    filteredVerifications = filteredVerifications.filter(
                        (verification) => verification.create_by === currentUsername
                    );
                }

                setVerifications(filteredVerifications);
            })
            .catch((err) => {
                console.error("Error fetching verifications:", err);
            });
    }, [currentUsername, projectId]);


    // Handle Search Reviewer button
    const handleSearchClick = (reviewers) => {
        setSelectedReviewers(reviewers);
        setShowModal(true);
    };


    // Handle Verify button
    const handleVerifyClick = (selectedRequirements) => {
        if (projectId) {
            navigate(`/ReqVerification?project_id=${projectId}`, {
                state: { selectedRequirements, project_id: projectId },
            });
        } else {
            console.error("Project ID is missing");
        }
    };

    const closeModal = () => setShowModal(false);

    return (
        <div className="verification-list-container">
            <h1>Verification List</h1>

            {verifications.length === 0 ? (
                <p>No verifications available.</p>
            ) : (
                <table className="verification-table">
                    <thead>
                        <tr>
                            <th>Verification</th>
                            <th>Create By</th>
                            <th>Date Assigned</th>
                            <th>Status</th>
                            <th>Reviewer</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
    {verifications.map((verification, index) => (
        <tr key={verification.id}>
            <td>{index + 1}</td> {/* ใช้ index + 1 เพื่อให้เป็นเลขที่เรียงลำดับ */}
            <td>{verification.create_by}</td>
            <td>{new Date(verification.created_at).toLocaleDateString()}</td>
            <td>{verification.verification_status || "WAITING FOR VERIFICATION"}</td>
            <td>
                <button
                    className="search-icon-button"
                    title="Search Reviewers"
                    onClick={() => handleSearchClick(verification.reviewers || [])}
                >
                    🔍
                </button>
            </td>
            <td>
                <button
                    className="verify-button"
                    onClick={() =>
                        handleVerifyClick(verification.requirements)
                    }
                >
                    Verify
                </button>
            </td>
        </tr>
    ))}
</tbody>

                </table>
            )}

            <Modal show={showModal} onClose={closeModal} reviewers={selectedReviewers} />
        </div>
    );
};

export default VerificationList;
