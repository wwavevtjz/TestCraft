import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CSS/VerificationList.css";

const VerificationList = () => {
    const [verifications, setVerifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const currentUsername = localStorage.getItem("username"); // ดึงชื่อผู้ใช้ที่ล็อกอิน

    useEffect(() => {
        axios
            .get("http://localhost:3001/verifications") // Adjust the URL based on your backend route
            .then((response) => {
                let filteredVerifications = response.data;

                // กรองข้อมูลหาก roles ไม่ใช่ Product Owner
                if (currentUsername !== "admin") {
                    filteredVerifications = filteredVerifications.filter(
                        (verification) => verification.verify_by === currentUsername
                    );
                }

                setVerifications(filteredVerifications); // ตั้งค่ารายการที่กรองแล้ว
                setError(null); // ลบข้อผิดพลาดก่อนหน้า
            })
            .catch((err) => {
                setError("Failed to load verification data.");
                console.error("Error fetching verifications:", err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [currentUsername]);

    const handleVerifyClick = (selectedRequirements, projectId) => {
        navigate(`/reqverification?project_id=${projectId}`, {
            state: { selectedRequirements, project_id: projectId },
        });
    };

    return (
        <div className="verification-list-container">
            <h1>Verification List</h1>

            {verifications.length === 0 ? (
                <p>No verifications available.</p> // Show a message when there are no verifications
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
                                    <button className="search-icon-button" title="Search Reviewer">
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
        </div>
    );
};

export default VerificationList;
