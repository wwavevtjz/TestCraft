import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import "./CSS/VerificationList.css";
import closemodalreview from "../image/close.png";
import notverify from "../image/notverify.png";

const Modal = ({ show, onClose, requirements = [], verificationBy = "" }) => {
  if (!show) return null;

  // ตรวจสอบว่า verificationBy เป็น array หรือ string
  const formattedVerificationBy = Array.isArray(verificationBy)
    ? verificationBy  // ถ้าเป็น array, ใช้ข้อมูลเป็น array เลย
    : typeof verificationBy === "string"
      ? verificationBy.split(",")  // ถ้าเป็น string, split ตาม "," เพื่อแยกออกเป็น array
      : [];  // ถ้าไม่มีข้อมูลให้เป็น array ว่าง

  return (
    <div className="modal-overlay-review">
      <div className="modal-content-review">
        <div>
          <h3>Reviewer</h3>
          {formattedVerificationBy.length > 0 ? (
            formattedVerificationBy.map((reviewer, index) => (
              <div className="list-reviewer" key={index}>
                <span>{reviewer}</span> {/* แสดงชื่อ reviewer */}
                <img src={notverify} alt="notverify" className="-notverify" /> {/* แสดงไอคอนหลังชื่อ */}
              </div>
            ))
          ) : (
            <div>No verification by users found.</div>  // ถ้าไม่มี reviewer
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
          <img src={closemodalreview} alt="closemodalreview" className="-closemodalreview" />
        </button>
      </div>
    </div>
  );
};


const VerificationList = () => {
    const [verifications, setVerifications] = useState([]);
    const [selectedRequirements, setSelectedRequirements] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const projectId = queryParams.get("project_id");
    const [selectedVerificationBy, setSelectedVerificationBy] = useState([]);

    // Fetch verifications
    const fetchVerifications = useCallback(() => {
        axios
            .get(`http://localhost:3001/verifications?project_id=${projectId}`)
            .then((response) => {
                const filteredVerifications = response.data
                    .filter((verification) => verification.requirement_status === "WAITING FOR VERIFICATION") // กรองเฉพาะสถานะนี้
                    .map((verification) => ({
                        ...verification,
                        verification_by: verification.verification_by || [], // ตรวจสอบค่าก่อนใส่ใน state
                    }))
                    .filter((value, index, self) => // กรองข้อมูลที่ซ้ำกัน
                        index === self.findIndex((v) => v.id === value.id)
                    );
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
        setSelectedVerificationBy(verificationBy || []); // เก็บค่า verificationBy
        setShowModal(true);
    };

    const handleVerifyClick = (verificationId, selectedRequirements) => {
        if (!projectId || selectedRequirements.length === 0) {
            toast.error("Invalid project ID or no requirements selected.");
            return;
        }

        const storedUsername = localStorage.getItem("username"); // ดึงชื่อผู้ใช้ที่ล็อกอิน

        if (!storedUsername) {
            toast.error("No user found. Please log in.");
            return;
        }

        const selectedVerification = verifications.find(
            (verification) => verification.id === verificationId
        );

        if (selectedVerification && !selectedVerification.verification_by.includes(storedUsername)) {
            toast.error("You are not a reviewer for this verification.");
            return;
        }

        // ส่งทั้ง project_id และ verification_id ผ่าน query string
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
