import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import './CSS/ProjectConfig.css';

const ProjectConfig = () => {
    const [newReqCriteria, setNewReqCriteria] = useState("");
    const [reqcriList, setReqcriList] = useState([]);
    const [loadingReq, setLoadingReq] = useState(true);

    const [newDesignCriteria, setNewDesignCriteria] = useState("");
    const [designCriList, setDesignCriList] = useState([]);
    const [loadingDesign, setLoadingDesign] = useState(true);

    const [newTestcaseCriteria, setNewTestcaseCriteria] = useState("");
    const [testcaseCriList, setTestcaseCriList] = useState([]);
    const [loadingTestcase, setLoadingTestcase] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        fetchReqCriteria();
        fetchDesignCriteria();
        fetchTestcaseCriteria();
    }, []);

    // Fetch Requirement Criteria List
    const fetchReqCriteria = async () => {
        try {
            setLoadingReq(true);
            const response = await axios.get("http://localhost:3001/reqcriteria");
            setReqcriList(response.data);
        } catch (error) {
            console.error("Error fetching requirement criteria:", error);
        } finally {
            setLoadingReq(false);
        }
    };

    // Fetch Design Criteria List
    const fetchDesignCriteria = async () => {
        try {
            setLoadingDesign(true);
            const response = await axios.get("http://localhost:3001/designcriteria");
            setDesignCriList(response.data);
        } catch (error) {
            console.error("Error fetching design criteria:", error);
        } finally {
            setLoadingDesign(false);
        }
    };

    // Fetch Testcase Criteria List
    const fetchTestcaseCriteria = async () => {
        try {
            setLoadingTestcase(true);
            const response = await axios.get("http://localhost:3001/testcasecriteria");
            setTestcaseCriList(response.data);
        } catch (error) {
            console.error("Error fetching testcase criteria:", error);
        } finally {
            setLoadingTestcase(false);
        }
    };

    // Add New Requirement Criteria
    const handleAddReqCriteria = async () => {
        if (newReqCriteria.trim() === "") {
            alert("กรุณากรอกชื่อ Requirement Criteria ก่อน");
            return;
        }
        try {
            await axios.post("http://localhost:3001/reqcriteria", { reqcri_name: newReqCriteria });
            setNewReqCriteria("");
            fetchReqCriteria();
        } catch (error) {
            console.error("Error adding requirement criteria:", error);
        }
    };

    // Add New Design Criteria
    const handleAddDesignCriteria = async () => {
        if (newDesignCriteria.trim() === "") {
            alert("กรุณากรอกชื่อ Design Criteria ก่อน");
            return;
        }
        try {
            await axios.post("http://localhost:3001/designcriteria", { design_cri_name: newDesignCriteria });
            setNewDesignCriteria("");
            fetchDesignCriteria();
        } catch (error) {
            console.error("Error adding design criteria:", error);
        }
    };

    // Add New Testcase Criteria
    const handleAddTestcaseCriteria = async () => {
        if (newTestcaseCriteria.trim() === "") {
            alert("กรุณากรอกชื่อ Testcase Criteria ก่อน");
            return;
        }
        try {
            await axios.post("http://localhost:3001/testcasecriteria", { testcasecri_name: newTestcaseCriteria });
            setNewTestcaseCriteria("");
            fetchTestcaseCriteria();
        } catch (error) {
            console.error("Error adding testcase criteria:", error);
        }
    };

    // Delete Criteria
    const handleDelete = async (id, type) => {
        if (!window.confirm("คุณแน่ใจหรือว่าต้องการลบ Criteria นี้?")) return;
        try {
            let endpoint = "";
            if (type === "requirement") endpoint = `http://localhost:3001/reqcriteria/${id}`;
            else if (type === "design") endpoint = `http://localhost:3001/designcriteria/${id}`;
            else if (type === "testcase") endpoint = `http://localhost:3001/testcasecriteria/${id}`;

            await axios.delete(endpoint);

            if (type === "requirement") fetchReqCriteria();
            else if (type === "design") fetchDesignCriteria();
            else if (type === "testcase") fetchTestcaseCriteria();
        } catch (error) {
            console.error("Error deleting criteria:", error);
        }
    };

    return (
        <div className="project-config-container">
            <div className="project-config-header">
                <h1>Configuration</h1>
            </div>

            <div className="project-config-content">
                {/* Software Requirement Specification Verification Criteria */}
                <div className="project-config-checklist-section">
                    <h2>Software Requirement Specification Verification Criteria</h2>
                    <div className="project-config-input-container">
                        <input
                            type="text"
                            value={newReqCriteria}
                            onChange={(e) => setNewReqCriteria(e.target.value)}
                            placeholder="Add New Criteria"
                            className="project-config-input"
                        />
                        <button className="project-config-add-button" onClick={handleAddReqCriteria}>
                            Add
                        </button>
                    </div>
                    {loadingReq ? <p>Loading...</p> : (
                        <ul className="project-config-criteria-list">
                            {reqcriList.map((criteria) => (
                                <li key={criteria.reqcri_id} className="project-config-criteria-item">
                                    <span>{criteria.reqcri_name}</span>
                                    <button className="project-config-delete-button" onClick={() => handleDelete(criteria.reqcri_id, "requirement")}>
                                        Delete
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Software Design Verification Criteria */}
                <div className="project-config-checklist-section">
                    <h2>Software Design Verification Criteria</h2>
                    <div className="project-config-input-container">
                        <input
                            type="text"
                            value={newDesignCriteria}
                            onChange={(e) => setNewDesignCriteria(e.target.value)}
                            placeholder="Add New Criteria"
                            className="project-config-input"
                        />
                        <button className="project-config-add-button" onClick={handleAddDesignCriteria}>
                            Add
                        </button>
                    </div>
                    {loadingDesign ? <p>Loading...</p> : (
                        <ul className="project-config-criteria-list">
                            {designCriList.map((criteria) => (
                                <li key={criteria.designcri_id} className="project-config-criteria-item">
                                    <span>{criteria.design_cri_name}</span>
                                    <button className="project-config-delete-button" onClick={() => handleDelete(criteria.designcri_id, "design")}>
                                        Delete
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Testcase Verification Criteria */}
                <div className="project-config-checklist-section">
                    <h2>Testcase Verification Criteria</h2>
                    <div className="project-config-input-container">
                        <input
                            type="text"
                            value={newTestcaseCriteria}
                            onChange={(e) => setNewTestcaseCriteria(e.target.value)}
                            placeholder="Add New Criteria"
                            className="project-config-input"
                        />
                        <button className="project-config-add-button" onClick={handleAddTestcaseCriteria}>
                            Add
                        </button>
                    </div>
                    {loadingTestcase ? <p>Loading...</p> : (
                        <ul className="project-config-criteria-list">
                            {testcaseCriList.map((criteria) => (
                                <li key={criteria.testcasecri_id} className="project-config-criteria-item">
                                    <span>{criteria.testcasecri_name}</span>
                                    <button className="project-config-delete-button" onClick={() => handleDelete(criteria.testcasecri_id, "testcase")}>
                                        Delete
                                    </button>
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
