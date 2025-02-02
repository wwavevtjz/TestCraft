import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import notverify from "../image/notverify.png";
import verifydone from "../image/verifydone.png";
import "./CSS/VeriDesign.css";

const Modal = ({ show, onClose, details = {}, veridesignBy = [] }) => {
    if (!show) return null;

// แปลงข้อมูล veridesignBy จาก ["Name: value"] เป็น { name, value }
const parsedVeridesignBy = veridesignBy.map((entry) => {
    const [name, value] = entry.split(": ");
    return { name, value: value === "true" }; // แปลงค่า value เป็น boolean
});
console.log(parsedVeridesignBy);


return (
    <div className="modal-overlay-review">
        <div className="modal-content-review">
            <h3>Design Details</h3>
            <div>
                <p><strong>Design ID:</strong> {details.design_ids?.join(", ") || "N/A"}</p>
                <p><strong>Created By:</strong> {details.created_by}</p>
            </div>


            <h3>Verification Status</h3>
            {parsedVeridesignBy.length > 0 ? (
                parsedVeridesignBy.map((reviewer, index) => (
                    <div className="list-reviewer" key={index}>
                        <span>{reviewer.name}</span>
                        <img
                            src={reviewer.value ? verifydone : notverify}
                            alt={reviewer.value ? "Verified" : "Not Verified"}
                            className="verification-status-icon"
                        />
                    </div>
                ))
            ) : (
                <div>No verification by users found.</div>
            )}


            <button className="close-modal-review-button" onClick={onClose}>✖ Close</button>
        </div>
    </div>
);
};
const VeriDesign = () => {
    const [designs, setDesigns] = useState([]);
    const [selectedDesign, setSelectedDesign] = useState({});
    const [assignedReviewers, setAssignedReviewers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const projectId = queryParams.get("project_id");

    
    const fetchDesigns = useCallback(() => {
        axios.get(`http://localhost:3001/verilistdesign?project_id=${projectId}`)
            .then((response) => {
                const processedDesigns = response.data
                    .map((design) => ({
                        ...design,
                        veridesign_by: (() => {
                            // ตรวจสอบว่าข้อมูล veridesign_by เป็น array ของชื่อผู้รีวิว
                            if (Array.isArray(design.veridesign_by)) {
                                return design.veridesign_by; // หากเป็น array ของชื่อผู้รีวิว ให้ใช้ตรงๆ
                            }
    
                            // หากไม่ใช่ array, ให้ลองแปลงเป็น array ของชื่อ (ตามกรณีที่เป็น string หรือ format อื่นๆ)
                            try {
                                return JSON.parse(design.veridesign_by || "[]").map(rev => rev.reviewerName);
                            } catch (error) {
                                console.error("Error parsing veridesign_by:", error);
                                return [];
                            }
                        })()
                    }))
                    .filter((design) => design.design_status === "WAITING FOR VERIFICATION")
                    .map((design) => ({
                        ...design,
                        veridesign_by: design.veridesign_by || [],
                    }));
                setDesigns(processedDesigns);
            })
            .catch((err) => {
                console.error("Error fetching designs:", err);
                toast.error("Error fetching designs.");
            });
    }, [projectId]);
    
    useEffect(() => {
        fetchDesigns();
    }, [fetchDesigns]);

    const handleSearchClick = (design, veridesignBy) => {
        setSelectedDesign(design || {});
        setAssignedReviewers(veridesignBy || []);
        setShowModal(true);
    };

    const handleVerifyClick = (design) => {
        if (!projectId || !design?.design_ids?.length) {
            toast.error("Invalid project ID or no design selected.");
            return;
        }
    
        const designId = design.design_ids.join(",");
        navigate(`/DesignVerifed?project_id=${projectId}&design_id=${designId}`, {
            state: { selectedDesign: design.design_ids }
        });
    };
    

    return (
        <div className="design-list-container">
            <h1>Design List</h1>
            {designs.length === 0 ? (
                <p>No designs available.</p>
            ) : (
                <table className="design-table">
                    <thead>
                        <tr>
                            <th>Round</th>
                            <th>Created By</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Reviewers</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {designs.map((design) => (
                            <tr key={design.veridesign_round}>
                                <td>{design.veridesign_round}</td>
                                <td>{design.create_by}</td>
                                <td>{new Date(design.veridesign_at).toLocaleDateString()}</td>
                                <td>{design.design_status || " "}</td>
                                <td>
                                    <button
                                        className="search-icon-button"
                                        title="View Reviewers"
                                        onClick={() =>
                                            handleSearchClick(
                                                { 
                                                    design_ids: design.design_ids,
                                                    design_status: design.design_status,
                                                    created_by: design.create_by
                                                },
                                                design.veridesign_by
                                            )
                                        }
                                    >
                                        🔍
                                    </button>
                                </td>
                                <td>
                                    <button onClick={() => handleVerifyClick(design)}>Verify</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <Modal
                show={showModal}
                onClose={() => setShowModal(false)}
                details={selectedDesign}
                veridesignBy={assignedReviewers}
            />
        </div>
    );
};

export default VeriDesign;
