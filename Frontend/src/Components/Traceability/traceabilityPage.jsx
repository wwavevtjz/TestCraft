import React, { useState, useEffect } from "react";
import "./traceabilityPage.css";
import canceltrace from "../Traceability/image/canceltrace.png";
import axios from "axios";
import { useParams, useLocation } from "react-router-dom";

const TraceabilityPage = () => {
    const [tableData, setTableData] = useState([]);
    const [sidebarRequirements, setSidebarRequirements] = useState([]);
    const [sidebarDesigns, setSidebarDesigns] = useState([]);
    const [draggedRequirement, setDraggedRequirement] = useState(null);
    const [draggedDesign, setDraggedDesign] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [rowsToAdd, setRowsToAdd] = useState(0);

    const { projectId: paramProjectId } = useParams();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const projectIdFromQuery = queryParams.get("project_id");

    const projectId = paramProjectId || projectIdFromQuery;

    // Fetch BASELINE requirements
    useEffect(() => {
        const fetchRequirements = async () => {
            if (!projectId) return;

            setLoading(true);
            setError(null);

            try {
                const response = await axios.get(
                    `http://localhost:3001/project/${projectId}/requirement`,
                    { params: { status: "BASELINE" } }
                );

                const baseline = response.data.filter(
                    (req) => req.requirement_status === "BASELINE" // Filter for BASELINE status
                );

                setSidebarRequirements(baseline);
            } catch {
                setError("Failed to load requirements. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchRequirements();
    }, [projectId]);

    // Fetch BASELINE designs
    useEffect(() => {
        const fetchDesigns = async () => {
            if (!projectId) return;

            setLoading(true);
            setError(null);

            try {
                const response = await axios.get("http://localhost:3001/design", {
                    params: { project_id: projectId },
                });

                const baselineDesigns = response.data.filter(
                    (design) => design.design_status === "BASELINE" // Filter for BASELINE status
                );

                setSidebarDesigns(baselineDesigns); // Set the filtered BASELINE designs
            } catch (error) {
                console.error("Error fetching designs:", error);
                setError("Failed to load designs. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchDesigns();
    }, [projectId]);

    const handleDragStart = (e, requirement, index = null, fromSidebar = false) => {
        if (!isEditing) return;
        setDraggedRequirement({ requirement, index, fromSidebar });
    };

    const handleDragStartDesign = (e, design, index = null, fromSidebar = false) => {
        if (!isEditing) return;
        setDraggedDesign({ design, index, fromSidebar });
    };

    const handleDragOver = (e) => {
        if (!isEditing) return;
        e.preventDefault();
    };

    const handleDropTable = (index) => {
        if (!isEditing || !draggedRequirement) return;

        const newData = [...tableData];

        if (draggedRequirement.fromSidebar) {
            // ตรวจสอบว่าเป็นแถวที่ถูกต้องและอัปเดตค่านั้น
            newData[index].requirement = draggedRequirement.requirement;
        } else {
            const prevIndex = draggedRequirement.index;
            // อัปเดตแค่แถวที่เกี่ยวข้อง
            if (newData[index] && newData[prevIndex]) {
                newData[index].requirement = draggedRequirement.requirement;
                newData[prevIndex].requirement = ""; // ลบข้อมูลจากแถวเดิม
            }
        }

        setTableData(newData);
        setDraggedRequirement(null);
    };


    const handleDropDesignTable = (index) => {
        if (!isEditing || !draggedDesign) return;
        const newData = [...tableData];

        if (draggedDesign.fromSidebar) {
            newData[index].design = draggedDesign.design;
        } else {
            const prevIndex = draggedDesign.index;
            // เปลี่ยนแค่แถวที่เกี่ยวข้อง
            newData[index].design = draggedDesign.design;
            newData[prevIndex].design = "";
        }

        setTableData(newData);
        setDraggedDesign(null);
    };


    const handleDropSidebar = () => {
        if (!isEditing || !draggedRequirement || draggedRequirement.fromSidebar) return;
        const newData = [...tableData];
        setSidebarRequirements([...sidebarRequirements, draggedRequirement.requirement]);
        newData[draggedRequirement.index].requirement = "";
        setTableData(newData);
        setDraggedRequirement(null);
    };

    const handleDropSidebarDesign = () => {
        if (!isEditing || !draggedDesign || draggedDesign.fromSidebar) return;
        const newData = [...tableData];
        setSidebarDesigns([...sidebarDesigns, draggedDesign.design]);
        newData[draggedDesign.index].design = "";
        setTableData(newData);
        setDraggedDesign(null);
    };

    const handleRemoveRequirement = (index) => {
        const newData = [...tableData];
        newData[index].requirement = "";  // Clear the requirement for this row
        setTableData(newData);
    };

    const handleRemoveDesign = (index) => {
        const newData = [...tableData];
        newData[index].design = ""; // Clear the design for this row
        setTableData(newData);
    };

    const handleSaveTraceability = async () => {
        // ตรวจสอบข้อมูลก่อนที่จะส่งไป backend
        const traceabilityData = tableData.map((row) => ({
            requirement_id: row.requirement || null, // กำหนดให้เป็น null ถ้าไม่มีค่า
            design_id: row.design || null,           // กำหนดให้เป็น null ถ้าไม่มีค่า
            project_id: projectId,                   // เก็บ project ID ที่จะส่งไป
        })).filter(row => row.requirement_id && row.design_id && row.project_id); // กรองเฉพาะข้อมูลที่ครบถ้วน

        if (traceabilityData.length === 0) {
            setError("Please ensure all required fields are filled.");
            return; // หยุดการส่งข้อมูลถ้าข้อมูลไม่ครบ
        }

        try {
            setLoading(true);
            setError(null);

            const response = await axios.post('http://localhost:3001/traceability', traceabilityData);
            alert('บันทึกข้อมูลเรียบร้อย!');
            setIsEditing(false); // ปิดโหมดการแก้ไขหลังจากบันทึกข้อมูลสำเร็จ
        } catch (error) {
            console.error('Error saving traceability data:', error);
            setError('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchTraceabilityData = async () => {
            if (!projectId) return;

            setLoading(true);
            setError(null);

            try {
                const response = await axios.get('http://localhost:3001/traceability', {
                    params: { project_id: projectId },
                });

                const traceabilityData = response.data.map(item => ({
                    id: item.tr_id, // ใช้ `tr_id` จาก API
                    requirement: item.requirement_id,
                    design: item.design_id,
                    implement: item.implement_id,
                    test: item.testcase_id,
                    timestamp: item.tr_at,
                }));

                setTableData(traceabilityData); // ตั้งค่า tableData
            } catch (error) {
                setError("Failed to load traceability records. Please try again later.");
            } finally {
                setLoading(false);
            }
        };


        fetchTraceabilityData();
    }, [projectId]);

    const handleAddRows = () => {
        const newRows = new Array(rowsToAdd).fill({
            requirement: '',
            design: '',
            implement: '',
            test: '',
        });
        setTableData(prevData => [...prevData, ...newRows]);
        setRowsToAdd(0);
    };


    return (
        <div className="traceability-container">
            <h2 className="header-traceability">Traceability Management</h2>

            <div className="traceability-management">
                {/* Sidebar */}
                <div className="sidebar-traceability" onDragOver={handleDragOver} onDrop={handleDropSidebar}>
                    <h3 className="req-trace">Requirement</h3>
                    {loading ? (
                        <p>Loading requirements...</p>
                    ) : error ? (
                        <p>{error}</p>
                    ) : (
                        sidebarRequirements.map((req, index) => (
                            <div
                                key={index}
                                className={`draggable-req ${isEditing ? "editable" : ""}`}
                                draggable={isEditing}
                                onDragStart={(e) => handleDragStart(e, req.requirement_id, index, true)} // Assuming requirement_id is the identifier
                            >
                                REQ-{req.requirement_id}
                            </div>
                        ))
                    )}

                    <h3 className="sd-trace">Design</h3>
                    {loading ? (
                        <p>Loading designs...</p>
                    ) : error ? (
                        <p>{error}</p>
                    ) : (
                        sidebarDesigns.map((design, index) => (
                            <div
                                key={index}
                                className={`draggable-design ${isEditing ? "editable" : ""}`}
                                draggable={isEditing}
                                onDragStart={(e) => handleDragStartDesign(e, design.design_id, index, true)} // Assuming design_id is the identifier
                            >
                                DE-{design.design_id}
                            </div>
                        ))
                    )}
                </div>

                {/* Main Content */}
                <div className="traceability-content">
                    <div className="traceability-header">
                        <h3 className="table-title">Traceability Record</h3>
                        <button
                            className={`edit-traceability ${isEditing ? "cancel" : ""}`}
                            onClick={() => setIsEditing(!isEditing)}
                        >
                            {isEditing ? "Cancel" : "Edit"}
                        </button>
                    </div>
                    <div>
                        <input
                            type="number"
                            min="1"
                            value={rowsToAdd}
                            onChange={(e) => setRowsToAdd(Number(e.target.value))}
                            placeholder="Enter number of rows"
                        />
                        <button onClick={handleAddRows}>Add Rows</button>
                    </div>

                    {/* Table */}
                    <table className="traceability-table">
                        <thead>
                            <tr>
                                <th>Traceability ID</th>
                                <th>Requirements ID</th>
                                <th>Design ID</th>
                                <th>Implement ID</th>
                                <th>Test Case ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map((row, index) => (
                                <tr key={index}>
                                    <td>{row.id}</td>
                                    <td
                                        className={`droppable ${isEditing ? "editable" : ""}`}
                                        onDragOver={handleDragOver}
                                        onDrop={() => handleDropTable(index)}
                                    >
                                        {isEditing ? (
                                            row.requirement ? (
                                                <div
                                                    className="draggable-req"
                                                    draggable={isEditing}
                                                    onDragStart={(e) => handleDragStart(e, row.requirement, index)}
                                                >
                                                    {"REQ-" + row.requirement}
                                                    <img
                                                        src={canceltrace}
                                                        alt="canceltrace"
                                                        className="canceltrace"
                                                        onClick={() => handleRemoveRequirement(index)}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="empty-cell"></div>
                                            )
                                        ) : (
                                            row.requirement ? "REQ-" + row.requirement : ""
                                        )}
                                    </td>
                                    <td
                                        className={`droppable ${isEditing ? "editable" : ""}`}
                                        onDragOver={handleDragOver}
                                        onDrop={() => handleDropDesignTable(index)}
                                    >
                                        {isEditing ? (
                                            row.design ? (
                                                <div
                                                    className="draggable-design"
                                                    draggable={isEditing}
                                                    onDragStart={(e) => handleDragStartDesign(e, row.design, index)}
                                                >
                                                    {"DE-" + row.design}
                                                    <img
                                                        src={canceltrace}
                                                        alt="canceltrace"
                                                        className="canceltrace"
                                                        onClick={() => handleRemoveDesign(index)}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="empty-cell"></div>
                                            )
                                        ) : (
                                            row.design ? "DE-" + row.design : ""
                                        )}
                                    </td>
                                    <td>{row.implement}</td>
                                    <td>{row.test}</td>
                                </tr>
                            ))}
                        </tbody>

                    </table>
                    {/* Save Button */}
                    <div className="savetrace-container">
                        <button
                            className="tracesave-button"
                            disabled={!isEditing} // ปิดใช้งานเมื่อไม่อยู่ในโหมดแก้ไข
                            onClick={handleSaveTraceability} // เรียกใช้ฟังก์ชันเมื่อกดปุ่ม
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TraceabilityPage;
