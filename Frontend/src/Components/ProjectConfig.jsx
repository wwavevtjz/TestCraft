import React, { useState, useEffect } from "react";
import axios from "axios";

const ProjectConfig = () => {
    const [newCriteria, setNewCriteria] = useState("");
    const [reqcriList, setReqcriList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState("");

    useEffect(() => {
        fetchCriteria();
    }, []);

    // ฟังก์ชันดึงข้อมูล Criteria
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

    // ฟังก์ชันเพิ่ม Criteria ใหม่
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

    // ฟังก์ชันแก้ไข Criteria
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

    // ฟังก์ชันลบ Criteria
    const handleDelete = async (id) => {
        if (!window.confirm("คุณแน่ใจหรือว่าต้องการลบ Criteria นี้?")) return;
        try {
            await axios.delete(`http://localhost:3001/reqcriteria/${id}`);
            fetchCriteria();
        } catch (error) {
            console.error("Error deleting criteria:", error);
        }
    };

    return (
        <div className="req-verification-container">
            <div className="header">
                <h1>Project Configuration</h1>
            </div>

            <div className="content">
                <div className="checklist-section">
                    <h2>SRS Verification Criteria</h2>
                    <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                        <input
                            type="text"
                            value={newCriteria}
                            onChange={(e) => setNewCriteria(e.target.value)}
                            placeholder="Add New Criteria"
                        />
                        <button className="add-button" onClick={handleAdd}>
                            Add
                        </button>
                    </div>
                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        <ul>
                            {reqcriList.map((criteria) => (
                                <li
                                    key={criteria.reqcri_id}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                    }}
                                >
                                    {editingId === criteria.reqcri_id ? (
                                        <>
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                            />
                                            <button onClick={handleUpdate}>Save</button>
                                            <button onClick={() => setEditingId(null)}>Cancel</button>
                                        </>
                                    ) : (
                                        <>
                                            <span>{criteria.reqcri_name}</span>
                                            <button onClick={() => {
                                                setEditingId(criteria.reqcri_id);
                                                setEditValue(criteria.reqcri_name);
                                            }}>
                                                Edit
                                            </button>
                                            <button onClick={() => handleDelete(criteria.reqcri_id)}>
                                                Delete
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
