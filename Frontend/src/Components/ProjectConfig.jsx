import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import './CSS/ProjectConfig.css';

const ProjectConfig = () => {
    const [newCriteria, setNewCriteria] = useState("");
    const [reqcriList, setReqcriList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState("");

    const navigate = useNavigate(); // ใช้เพื่อไปยังหน้า VersionControl.jsx

    useEffect(() => {
        fetchCriteria();
    }, []);

    // Fetch Criteria List
    const fetchCriteria = async () => {
        try {
            setLoading(true);
            const response = await axios.get("http://localhost:3001/reqcriteria");
            setReqcriList(response.data);
        } catch (error) {
            console.error("Error fetching criteria:", error);
        } finally {
            setLoading(false);
        }
    };

    // Add New Criteria
    const handleAdd = async () => {
        if (newCriteria.trim() === "") {
            alert("กรุณากรอกชื่อ Criteria ก่อน");
            return;
        }
        try {
            await axios.post("http://localhost:3001/reqcriteria", { reqcri_name: newCriteria });
            setNewCriteria("");
            fetchCriteria();
        } catch (error) {
            console.error("Error adding criteria:", error);
        }
    };

    // Edit Criteria
    const handleUpdate = async () => {
        if (editValue.trim() === "") {
            alert("กรุณากรอกค่าที่ต้องการแก้ไข");
            return;
        }
        try {
            await axios.put(`http://localhost:3001/reqcriteria/${editingId}`, { reqcri_name: editValue });
            setEditingId(null);
            setEditValue("");
            fetchCriteria();
        } catch (error) {
            console.error("Error updating criteria:", error);
        }
    };

    // Delete Criteria
    const handleDelete = async (id) => {
        if (!window.confirm("คุณแน่ใจหรือว่าต้องการลบ Criteria นี้?")) return;
        try {
            await axios.delete(`http://localhost:3001/reqcriteria/${id}`);
            fetchCriteria();
        } catch (error) {
            console.error("Error deleting criteria:", error);
        }
    };

    // Navigate to VersionControl Page
    const handleViewHistory = (id) => {
        navigate(`/version-control/${id}`);
    };

    return (
        <div className="project-config-container">
            <div className="project-config-header">
                <h1>Configuration</h1>
            </div>

            <div className="project-config-content">
                <div className="project-config-checklist-section">
                    <h2>Software Requirement Specification Verification Criteria</h2>
                    <div className="project-config-input-container">
                        <input
                            type="text"
                            value={newCriteria}
                            onChange={(e) => setNewCriteria(e.target.value)}
                            placeholder="Add New Criteria"
                            className="project-config-input"
                        />
                        <button className="project-config-add-button" onClick={handleAdd}>
                            Add
                        </button>
                    </div>
                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        <ul className="project-config-criteria-list">
                            {reqcriList.map((criteria) => (
                                <li
                                    key={criteria.reqcri_id}
                                    className="project-config-criteria-item"
                                >
                                    {editingId === criteria.reqcri_id ? (
                                        <>
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="project-config-input"
                                            />
                                            <button className="project-config-save-button" onClick={handleUpdate}>
                                                Save
                                            </button>
                                            <button
                                                className="project-config-cancel-button"
                                                onClick={() => setEditingId(null)}
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <span>{criteria.reqcri_name}</span>
                                            <button
                                                className="project-config-edit-button"
                                                onClick={() => {
                                                    setEditingId(criteria.reqcri_id);
                                                    setEditValue(criteria.reqcri_name);
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="project-config-delete-button"
                                                onClick={() => handleDelete(criteria.reqcri_id)}
                                            >
                                                Delete
                                            </button>
                                            <button
                                                className="project-config-history-button"
                                                onClick={() => handleViewHistory(criteria.reqcri_id)}
                                            >
                                                History
                                            </button>
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectConfig;
