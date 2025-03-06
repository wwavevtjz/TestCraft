import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Select from "react-select";
import "./CSS/UpdateDesign.css";
import Swal from "sweetalert2";

const UpdateDesign = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const projectId = queryParams.get("project_id");
    const designId = queryParams.get("design_id");

    const [designData, setDesignData] = useState({
        diagram_name: "",
        design_type: "",
        diagram_type: "",
        design_description: "",
        requirement_id: [],
    });
    const [baselineRequirements, setBaselineRequirements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [filePreviews, setFilePreviews] = useState([]);
    const [existingFiles, setExistingFiles] = useState([]);
    const [showModal, setShowModal] = useState(false);

    // กำหนดค่าเริ่มต้นของข้อมูลที่โหลดมา
    const [initialDesignData, setInitialDesignData] = useState({
        diagram_name: "",
        design_type: "",
        diagram_type: "",
        design_description: "",
        requirement_id: [],
    });

    // Fetch Design Details
    useEffect(() => {
        const fetchDesign = async () => {
            try {
                const response = await axios.get(`http://localhost:3001/designedit`, {
                    params: { project_id: projectId, design_id: designId },
                });
                if (response.data.length > 0) {
                    const design = response.data[0];
                    setDesignData({
                        diagram_name: design.diagram_name,
                        design_type: design.design_type,
                        diagram_type: design.diagram_type,
                        design_description: design.design_description,
                        requirement_id: design.requirement_id ? JSON.parse(design.requirement_id) : [],
                        design_status: design.design_status || "WORKING",
                    });
                    // กำหนดค่าเริ่มต้นให้กับ initialDesignData
                    setInitialDesignData({
                        diagram_name: design.diagram_name,
                        design_type: design.design_type,
                        diagram_type: design.diagram_type,
                        design_description: design.design_description,
                        requirement_id: design.requirement_id ? JSON.parse(design.requirement_id) : [],
                    });
                } else {
                    console.log("No design data found");
                }
            } catch (error) {
                console.error("Error fetching design:", error);
                alert("Failed to fetch design data");
            } finally {
                setLoading(false);
            }
        };

        const fetchRequirements = async () => {
            try {
                const response = await axios.get(`http://localhost:3001/project/${projectId}/requirement`, {
                    params: { status: "BASELINE" },
                });
                setBaselineRequirements(response.data);
            } catch (error) {
                console.error("Error fetching requirements:", error);
                alert("Failed to fetch baseline requirements");
            } finally {
                setLoading(false);  // เรียก setLoading(false) ใน finally เพื่อให้แน่ใจว่าโหลดเสร็จ
            }
        };

        if (designId && projectId) {
            fetchDesign();
            fetchRequirements();
        } else {
            console.error("Missing designId or projectId");
            setLoading(false);
        }
    }, [designId, projectId]);  // ให้ useEffect ทำงานใหม่เมื่อ designId หรือ projectId เปลี่ยน

    // ฟังก์ชันตรวจสอบว่าไม่มีการเปลี่ยนแปลง
    const isDataUnchanged =
        designData.diagram_name === initialDesignData.diagram_name &&
        designData.design_type === initialDesignData.design_type &&
        designData.diagram_type === initialDesignData.diagram_type &&
        designData.design_description === initialDesignData.design_description &&
        JSON.stringify(designData.requirement_id) === JSON.stringify(initialDesignData.requirement_id) &&
        selectedFiles.length === 0;  // เช็คว่าไม่มีการอัปโหลดไฟล์ใหม่


    const handleUpdate = async (e) => {
        e.preventDefault();

        if (designData.design_status !== "WORKING" && !isDataUnchanged) {
            const confirmChange = await Swal.fire({
                title: "ต้องการแก้ไขข้อมูลหรือไม่?",
                text: "ถ้าคุณแก้ไขข้อมูล สถานะจะเปลี่ยนเป็น WORKING",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "ตกลง",
                cancelButtonText: "ยกเลิก",
            });

            if (!confirmChange.isConfirmed) return;
            setDesignData(prev => ({ ...prev, design_status: "WORKING" }));
        }

        if (isDataUnchanged) {
            Swal.fire({
                title: "No Changes Detected",
                text: "ไม่มีการแก้ไขข้อมูล ระบบจะกลับไปที่หน้าดีไซน์",
                icon: "info",
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                navigate(`/Dashboard?project_id=${projectId}`, { state: { selectedSection: "Design" } });
            });
            return;
        }

        const result = await Swal.fire({
            title: "ยืนยันการอัปเดต?",
            text: "คุณต้องการอัปเดตการออกแบบหรือไม่?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "ตกลง",
            cancelButtonText: "ยกเลิก",
        });

        if (!result.isConfirmed) return;
        updateDesign();
    };

    const updateDesign = async () => {
        try {
            const formData = new FormData();
            formData.append("design_id", designId);
            selectedFiles.forEach((file) => {
                formData.append("files", file);
            });

            await axios.put(`http://localhost:3001/design/${designId}`, {
                project_id: projectId,
                diagram_name: designData.diagram_name,
                design_type: designData.design_type,
                diagram_type: designData.diagram_type,
                design_description: designData.design_description,
                requirement_id: designData.requirement_id,
                design_status: designData.design_status
            });

            await axios.post("http://localhost:3001/uploadDesignFiles", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            Swal.fire({
                title: "อัปเดตสำเร็จ!",
                text: "การออกแบบถูกอัปเดตเรียบร้อยแล้ว",
                icon: "success",
                timer: 1500,
                showConfirmButton: false,
            }).then(() => {
                navigate(`/Dashboard?project_id=${projectId}`, { state: { selectedSection: "Design" } });
            });
        } catch (error) {
            console.error("Error updating design:", error);
            Swal.fire("Error", "ไม่สามารถอัปเดตการออกแบบได้ กรุณาลองใหม่อีกครั้ง", "error");
        }
    };



    const handleChange = (e) => {
        setDesignData({ ...designData, [e.target.name]: e.target.value });
    };

    const handleRequirementChange = (selectedOptions) => {
        setDesignData({
            ...designData,
            requirement_id: selectedOptions.map((option) => option.value),
        });
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(files);

        const previews = files.map((file) => URL.createObjectURL(file));
        setFilePreviews(previews);
    };

    const handleFileClick = (file) => {
        const fileBlob = new Blob([file.file_design_data], { type: "application/pdf" });
        const fileURL = URL.createObjectURL(fileBlob);
        window.open(fileURL, "_blank");
    };

    return (
        <div className="update-design-container">
            <h1 className="update-design-title">Update Design</h1>
            {loading ? (
                <p className="loading-text">Loading...</p>
            ) : (
                <form className="update-design-form" onSubmit={handleUpdate}>
                    <label className="update-design-label">
                        Diagram Name:
                        <input
                            className="update-design-input"
                            type="text"
                            name="diagram_name"
                            value={designData.diagram_name}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <label className="update-design-label">
                        Design Type:
                        <select
                            className="update-design-select"
                            name="design_type"
                            value={designData.design_type}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Design Type</option>
                            <option value="High-Level Design">High-Level Design</option>
                            <option value="Low-Level Design">Low-Level Design</option>
                        </select>
                    </label>

                    <label className="update-design-label">
                        Diagram Type:
                        <select
                            className="update-design-select"
                            name="diagram_type"
                            value={designData.diagram_type}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Diagram Type</option>
                            <option value="Prototype">Prototype</option>
                            <option value="Flow Chart">Flow Chart</option>
                            <option value="ER Diagram">ER Diagram</option>
                            <option value="Pseudo Code">Pseudo Code</option>
                        </select>
                    </label>

                    <label className="update-design-label">
                        Requirements:
                        <Select
                            className="update-design-select"
                            isMulti
                            options={baselineRequirements.map((req) => ({
                                value: req.requirement_id,
                                label: `REQ-00${req.requirement_id}: ${req.requirement_name}`,
                            }))}
                            onChange={handleRequirementChange}
                            value={baselineRequirements
                                .filter((req) => designData.requirement_id.includes(req.requirement_id))
                                .map((req) => ({
                                    value: req.requirement_id,
                                    label: `REQ-00${req.requirement_id}: ${req.requirement_name}`,
                                }))}
                        />
                    </label>

                    <label className="update-design-label">
                        Design Description:
                        <textarea
                            className="update-design-textarea"
                            name="design_description"
                            value={designData.design_description}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <label className="update-design-label">
                        Upload Files:
                        <input
                            className="update-design-input-file"
                            type="file"
                            multiple
                            onChange={handleFileChange}
                        />
                    </label>

                    <div className="update-design-files">
                        <h3>Existing Files:</h3>
                        {existingFiles.length > 0 ? (
                            <ul>
                                {existingFiles.map((file) => (
                                    <li key={file.file_design_id}>
                                        <button
                                            type="button"
                                            className="update-design-file-btn"
                                            onClick={() => handleFileClick(file)}
                                        >
                                            View File {file.file_design_id}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No files available.</p>
                        )}
                    </div>

                    <div className="update-design-file-previews">
                        {filePreviews.length > 0 && (
                            <div>
                                <h4>File Previews:</h4>
                                {filePreviews.map((preview, index) => (
                                    <div key={index}>
                                        <img src={preview} alt={`Preview ${index}`} width={100} height={100} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="update-design-buttons">
                        <button
                            className="update-design-btn-cancel"
                            type="button"
                            onClick={() => navigate(`/Dashboard?project_id=${projectId}`, {
                                state: { selectedSection: "Design" }
                            })}
                        >
                            Cancel
                        </button>
                        <button className="update-design-btn" type="submit">
                            Update
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default UpdateDesign;
