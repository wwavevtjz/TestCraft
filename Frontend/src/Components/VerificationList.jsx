import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./CSS/VerificationList.css";


// Modal Component
const Modal = ({ show, onClose, requirement }) => {
    if (!show) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Requirement Verification Info</h2>
                {requirement && requirement.length > 0 ? (
                    requirement.map((req, index) => {
                        // ตรวจสอบว่า req.verifiedBy เป็นอาร์เรย์หรือไม่
                        const verifiedBy = Array.isArray(req.verifiedBy) ? req.verifiedBy : [req.verifiedBy];

                        return (
                            <div key={index}>
                                <p><strong>Requirement ID:</strong> {req.reqId}</p>
                                <p><strong>Verified By:</strong> {verifiedBy.length > 0 ? verifiedBy.join(", ") : "No reviewers"}</p>
                                <hr />
                            </div>
                        );
                    })
                ) : (
                    <p>No requirements found.</p>
                )}
                <button className="close-modal-button" onClick={onClose}>Close</button>
            </div>
        </div>
    );
};


const VerificationList = () => {
    const [verifications, setVerifications] = useState([]);
    const [selectedRequirement, setSelectedRequirement] = useState([]); // เปลี่ยนเป็นอาร์เรย์
    const [showModal, setShowModal] = useState(false); // ควบคุมการแสดง modal
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const projectId = queryParams.get("project_id");
    const currentUsername = localStorage.getItem("username");

    useEffect(() => {
        axios
            .get("http://localhost:3001/verifications")
            .then((response) => {
                let filteredVerifications = response.data;

                if (currentUsername !== "admin") {
                    filteredVerifications = filteredVerifications.filter(
                        (verification) => verification.verify_by === currentUsername
                    );
                }

                setVerifications(filteredVerifications);
            })
            .catch((err) => {
                console.error("Error fetching verifications:", err);
            });
    }, [currentUsername]);


    const handleVerifyClick = (selectedRequirements) => {
        // Extract projectId from URL search params directly
        const projectId = new URLSearchParams(window.location.search).get("project_id");
        
        console.log("project_id from handleVerifyClick:", projectId); // ตรวจสอบว่า project_id ถูกส่งมาหรือไม่
        if (projectId) {
            navigate(`/ReqVerification?project_id=${projectId}`, {
                state: { selectedRequirements, project_id: projectId },
            });
        } else {
            console.error("Project ID is missing");
        }
    };
    
    




    const handleSearchClick = (requirements, verification) => {
        // สร้างข้อมูล requirement ที่ต้องการแสดงใน modal
        const requirementInfo = requirements.map((req) => {
            const verifiedBy = Array.isArray(verification.verify_by) ? verification.verify_by : [verification.verify_by];
            return {
                reqId: `REQ-0${req}`,
                verifiedBy: verifiedBy // เก็บข้อมูลผู้ตรวจสอบทั้งหมด
            };
        });

        setSelectedRequirement(requirementInfo);
        setShowModal(true); // แสดง modal
    };

    const closeModal = () => {
        setShowModal(false); // ปิด modal
    };

    return (
        <div className="verification-list-container">
            <h1>Verification List</h1>

            {verifications.length === 0 ? (
                <p>No verifications available.</p>
            ) : (
                <table className="verification-table">
                    <thead>
                        <tr>
                            <th>Requirement ID</th>
                            <th>Verify By</th>
                            <th>Date assigned</th>
                            <th>Reviewer</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {verifications.map((verification) => (
                            <tr key={verification.id}>
                                <td>
                                    {verification.requirements.map((req, index) => (
                                        <div key={index}>REQ-0{req}</div>
                                    ))}
                                </td>
                                <td>{verification.verify_by}</td>
                                <td>{new Date(verification.created_at).toLocaleDateString()}</td>
                                <td>
                                    <button
                                        className="search-icon-button"
                                        title="Search Reviewer"
                                        onClick={() => handleSearchClick(verification.requirements, verification)}
                                    >
                                        🔍
                                    </button>
                                </td>
                                <td>
                                    <button
                                        className="verify-button"
                                        onClick={() =>
                                            handleVerifyClick(verification.requirements, verification.project_id)
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

            {/* แสดง Modal หาก showModal เป็น true */}
            <Modal show={showModal} onClose={closeModal} requirement={selectedRequirement} />
        </div>
    );
};

export default VerificationList;
