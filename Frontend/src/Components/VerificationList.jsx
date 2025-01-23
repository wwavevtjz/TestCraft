import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import "./CSS/VerificationList.css";
import closemodalreview from "../image/close.png";
import notverify from "../image/notverify.png";
import verifydone from "../image/verifydone.png";

const Modal = ({ show, onClose, requirements = [], verificationBy = [] }) => {
    if (!show) return null;

    // แปลงข้อมูล verificationBy จาก ["Name: value"] เป็น { name, value }
    const parsedVerificationBy = verificationBy.map((entry) => {
        const [name, value] = entry.split(": "); // แยกชื่อและค่าออกจากกัน
        return { name, value: value === "true" }; // แปลงค่า value เป็น boolean
    });

    return (
        <div className="modal-overlay-review">
            <div className="modal-content-review">
                <div>
                    <h3>Reviewer</h3>
                    {parsedVerificationBy.length > 0 ? (
                        parsedVerificationBy.map((reviewer, index) => (
                            <div className="list-reviewer" key={index}>
                                <span>{reviewer.name}</span>
                                <img
                                    src={reviewer.value ? verifydone : notverify} // ตรวจสอบค่า reviewer.value
                                    alt={reviewer.value ? "Verified" : "Not Verified"}
                                    className="verification-status-icon"
                                />
                            </div>
                        ))
                    ) : (
                        <div>No verification by users found.</div>
                    )}
                </div>
                <div>
                    <h3>Requirement</h3>
                    {requirements.length > 0 ? (
                        requirements.map((req, index) => (
                            <div key={index} className="req-review">Requirement ID: {req}</div>
                        ))
                    ) : (
                        <div>No requirements found.</div>
                    )}
                </div>
                <button className="close-modal-review-button" onClick={onClose}>
                    <img src={closemodalreview} alt="Close" className="closemodalreview" />
                </button>
            </div>
        </div>
    );
};

const VerificationList = () => {
    const [verifications, setVerifications] = useState([]);
    const [selectedRequirements, setSelectedRequirements] = useState([]);
    const [selectedVerificationBy, setSelectedVerificationBy] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const projectId = queryParams.get("project_id");

    const fetchVerifications = useCallback(() => {
        axios
            .get(`http://localhost:3001/verifications?project_id=${projectId}`)
            .then((response) => {
                const filteredVerifications = response.data
                    .filter((verification) => verification.requirement_status === "WAITING FOR VERIFICATION")
                    .map((verification) => ({
                        ...verification,
                        verification_by: verification.verification_by || [],
                    }));
                setVerifications(filteredVerifications);
            })
            .catch((err) => {
                console.error("Error fetching verifications:", err);
                toast.error("Error fetching verifications.");
            });
    }, [projectId]);

    useEffect(() => {
        fetchVerifications();
    }, [fetchVerifications]);

    const handleSearchClick = (requirements, verificationBy) => {
        setSelectedRequirements(requirements || []);
        setSelectedVerificationBy(verificationBy || []); // ส่งค่าข้อมูล verificationBy
        setShowModal(true);
    };

    const handleVerifyClick = (verificationId, selectedRequirements) => {
        if (!projectId || selectedRequirements.length === 0) {
            toast.error("Invalid project ID or no requirements selected.");
            return;
        }

        const storedUsername = localStorage.getItem("username");
        if (!storedUsername) {
            toast.error("No user found. Please log in.");
            return;
        }

        navigate(`/ReqVerification?project_id=${projectId}&verification_id=${verificationId}`, {
            state: { selectedRequirements, project_id: projectId, verification_id: verificationId },
        });
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
                        {verifications.map((verification) => (
                            <tr key={verification.id}>
                                <td>{verification.id}</td>
                                <td>{verification.create_by}</td>
                                <td>{new Date(verification.created_at).toLocaleDateString()}</td>
                                <td>{verification.requirement_status || " "}</td>
                                <td>
                                    <button
                                        className="search-icon-button"
                                        title="Search Reviewers and Requirements"
                                        onClick={() =>
                                            handleSearchClick(
                                                verification.requirements || [],
                                                verification.verification_by || []
                                            )
                                        }
                                    >
                                        🔍
                                    </button>
                                </td>
                                <td>
                                    <button
                                        className="verify-button"
                                        onClick={() =>
                                            handleVerifyClick(verification.id, verification.requirements)
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

            <Modal
                show={showModal}
                onClose={closeModal}
                requirements={selectedRequirements}
                verificationBy={selectedVerificationBy}
            />
        </div>
    );
};

export default VerificationList;
