import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "./traceabilityPage.css"; // นำเข้าไฟล์ CSS

const TraceabilityPage = () => {
    const [traceabilityData, setTraceabilityData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const projectId = queryParams.get("project_id");

    useEffect(() => {
        const fetchData = async () => {
            if (!projectId) {
                setError("ไม่มี project_id ใน URL");
                setLoading(false);
                return;
            }

            try {
                console.log("📡 Fetching data...");
                const response = await axios.get("http://localhost:3001/traceability", {
                    params: { projectId },
                });

                console.log("✅ Data received:", response.data);
                setTraceabilityData(response.data);
                setLoading(false);
            } catch (err) {
                console.error("❌ Fetch error:", err);
                setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
                setLoading(false);
            }
        };

        fetchData();
    }, [projectId]);

    if (loading) return <div className="loading">กำลังโหลด...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="traceability-container">
            <h1>Traceability Record</h1>
            <div className="traceability-graph">
                {traceabilityData.length > 0 ? (
                    <svg width="100%" height="400">
                        {traceabilityData.map((item, index) => (
                            <g key={index}>
                                <line
                                    x1="150" y1={50 + index * 100} x2="350" y2={50 + index * 100}
                                    stroke="red" strokeWidth="2"
                                />
                                <line
                                    x1="350" y1={50 + index * 100} x2="550" y2={50 + index * 100}
                                    stroke="red" strokeWidth="2" strokeDasharray="5,5"
                                />
                                <line
                                    x1="550" y1={50 + index * 100} x2="750" y2={50 + index * 100}
                                    stroke="red" strokeWidth="2"
                                />

                                <rect x="100" y={30 + index * 100} width="100" height="40" stroke="black" fill="white" />
                                <text x="110" y={55 + index * 100} fill="black">{`REQ${item.RequirementID}`}</text>

                                <rect x="300" y={30 + index * 100} width="100" height="40" stroke="black" fill="white" />
                                <text
                                    x="310"
                                    y={55 + index * 100}
                                    fill="black"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => navigate(`/ViewDesign?project_id=${projectId}&design_id=${item.DesignID}`)}
                                >
                                    {`DE${item.DesignID}`}
                                </text>

                                <rect x="500" y={30 + index * 100} width="100" height="40" stroke="black" fill="white" />
                                <text x="510" y={55 + index * 100} fill="black">{`IMP${item.ImplementID}`}</text>

                                <rect x="700" y={30 + index * 100} width="100" height="40" stroke="black" fill="white" />
                                <text x="710" y={55 + index * 100} fill="black">{`TC${item.TestCaseID}`}</text>
                            </g>
                        ))}
                    </svg>
                ) : (
                    <p>ไม่มีข้อมูล</p>
                )}
            </div>

            <table className="traceability-table">
                <thead>
                    <tr>
                        <th>Requirement ID</th>
                        <th>Design ID</th>
                        <th>Code Component ID</th>
                        <th>Test Case ID</th>
                    </tr>
                </thead>
                <tbody>
                    {traceabilityData.map((item, index) => (
                        <tr key={index}>
                            <td>{`REQ${item.RequirementID}`}
                                <button className="view-req-trace" onClick={() => navigate(`/ViewEditReq?requirement_id=${item.RequirementID}`)}>VIEW </button>
                                <button className="edit-req-trace" onClick={() => navigate(`/UpdateRequirement?requirement_id=${item.RequirementID}&project_id=${projectId}`)}>EDIT </button>
                            </td>
                            <td>
                                {`DE${item.DesignID}`}
                                <button
                                    onClick={() => navigate(`/ViewDesign?project_id=${projectId}&design_id=${item.DesignID}`)}
                                    className="view-design-trace"
                                >
                                    VIEW
                                </button>
                                <button
                                    onClick={() => navigate(`/UpdateDesign?project_id=${projectId}&design_id=${item.DesignID}`)}
                                    className="edit-design-trace"
                                >
                                    EDIT
                                </button>
                            </td>
                            <td>{`IMP${item.ImplementID}`}</td>
                            <td>{`TC${item.TestCaseID}`}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TraceabilityPage;
