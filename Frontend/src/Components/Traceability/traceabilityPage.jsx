import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import './traceabilityPage.css'; // นำเข้าไฟล์ CSS

const TraceabilityPage = () => {
    const [traceabilityData, setTraceabilityData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ดึงข้อมูลจาก URL
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const projectId = queryParams.get("project_id");

    useEffect(() => {
        const fetchData = async () => {
            if (!projectId) {
                setError('ไม่มี project_id ใน URL');
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get('http://localhost:3001/traceability', {
                    params: { projectId } // ส่ง projectId ผ่าน query parameters
                });
                setTraceabilityData(response.data); // เก็บข้อมูลใน state
                setLoading(false); // เปลี่ยนสถานะเป็นไม่โหลดแล้ว
            } catch (err) {
                setError('เกิดข้อผิดพลาดในการดึงข้อมูล');
                setLoading(false);
            }
        };

        fetchData();
    }, [projectId]); // รันซ้ำเมื่อ projectId เปลี่ยนแปลง

    if (loading) return <div className="loading">กำลังโหลด...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="traceability-container">
            <h1>Traceability Record</h1>
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
                            <td>{item.RequirementID}</td>
                            <td>{item.DesignID}</td>
                            <td>{item.ImplementID}</td>
                            <td>{item.TestCaseID}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TraceabilityPage;
