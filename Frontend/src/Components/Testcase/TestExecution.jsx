import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";

const TestExecution = () => {
    const { testcaseId } = useParams();
    const location = useLocation();
    const testCase = location.state?.testCase || {}; // รับ testCase จาก ExecutionList

    const [testProcedures, setTestProcedures] = useState([]);

    useEffect(() => {
        const numericTestCaseId = testcaseId.replace('TC-', '');
    
        console.log("Fetching data for testcaseId:", numericTestCaseId);
    
        if (numericTestCaseId) {
            axios.get(`http://localhost:3001/testexecution/testcase/${numericTestCaseId}/procedures`)
                .then(response => {
                    console.log("API Response:", response.data);
                    
                    // กรองข้อมูล test_procedures ตาม test_objective ที่ตรงกับหัวข้อที่เลือก
                    const filteredProcedures = response.data.filter(test =>
                        test.test_objective === testCase.objective
                    );
                    
                    setTestProcedures(filteredProcedures);
                })
                .catch(error => console.error("Error fetching test procedures:", error));
        }
    }, [testcaseId, testCase.objective]);

    // ฟังก์ชันในการอัปเดตค่าที่กรอก
    const handleInputChange = (e, field, index) => {
        const updatedProcedures = [...testProcedures];
        updatedProcedures[index][field] = e.target.value;
        setTestProcedures(updatedProcedures);
    };

    // ฟังก์ชันในการเลือกค่า Test Status
    const handleTestStatusChange = (e, index) => {
        const updatedProcedures = [...testProcedures];
        updatedProcedures[index].test_status = e.target.value;
        setTestProcedures(updatedProcedures);
    };

    // ฟังก์ชันบันทึกข้อมูล
    const handleSave = () => {
        testProcedures.forEach(proc => {
            axios.put(`http://localhost:3001/api/test-procedures/${proc.test_procedures_id}`, {
                test_objective: proc.test_objective,
                test_condition: proc.test_condition,
                test_step: proc.test_step,
                expected_result: proc.expected_result,
                test_data: proc.test_data,
                test_status: proc.test_status,
                tested_by: proc.tested_by,
            })
            .then(response => {
                console.log("Test procedure updated:", response.data);
                alert("Test procedure updated successfully!");
            })
            .catch(error => {
                console.error("Error updating test procedure:", error);
                alert("Failed to update test procedure.");
            });
        });
    };

    return (
        <div className="test-execution-container">
            <h1 className="test-execution-header">
                Test Execution: {testcaseId} - {testCase.objective || "No Objective"}
            </h1>

            <div className="test-execution-table-container">
                <div className="test-execution-table-wrapper" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    <table className="test-execution-table">
                        <thead>
                            <tr className="test-execution-table-header">
                                <th className="test-execution-table-cell">Test Objective</th>
                                <th className="test-execution-table-cell">Test Condition</th>
                                <th className="test-execution-table-cell">Test Step</th>
                                <th className="test-execution-table-cell">Expected Result</th>
                                <th className="test-execution-table-cell">Test Data</th>
                                <th className="test-execution-table-cell">Test Status</th>
                                <th className="test-execution-table-cell">Tested By</th>
                                <th className="test-execution-table-cell">Tested Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {testProcedures.length > 0 ? (
                                testProcedures.map((test, index) => (
                                    <tr key={index} className="test-execution-table-row text-center">
                                        {/* แสดง Test Objective แค่ครั้งเดียว */}
                                        {index === 0 || test.test_objective !== testProcedures[index - 1].test_objective ? (
                                            <td className="test-execution-table-cell">{test.test_objective || ""}</td>
                                        ) : (
                                            <td className="test-execution-table-cell"></td> // แสดงเป็นช่องว่างถ้า test_objective ซ้ำ
                                        )}
                                        <td className="test-execution-table-cell">{test.test_condition || ""}</td>
                                        <td className="test-execution-table-cell">{test.test_step || ""}</td>
                                        <td className="test-execution-table-cell">{test.expected_result || ""}</td>
                                        
                                        {/* Test Data, Test Status, Tested By, Tested Date เป็นช่องกรอกข้อมูลเปล่าๆ */}
                                        <td className="test-execution-table-cell">
                                            <textarea
                                                value={test.test_data || ""}
                                                onChange={(e) => handleInputChange(e, "test_data", index)}
                                                className="test-execution-textarea"
                                            />
                                        </td>

                                        {/* Test Status จะเป็น dropdown */}
                                        <td className="test-execution-table-cell">
                                            <select
                                                value={test.test_status || "Not Start"}
                                                onChange={(e) => handleTestStatusChange(e, index)}
                                                className="test-execution-input-field"
                                            >
                                                <option value="Not Start">Not Start</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Passed">Passed</option>
                                                <option value="Passed with Condition">Passed with Condition</option>
                                                <option value="Failed">Failed</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                        
                                        <td className="test-execution-table-cell">
                                            <input
                                                type="text"
                                                value={test.tested_by || ""}
                                                onChange={(e) => handleInputChange(e, "tested_by", index)}
                                                className="test-execution-input-field"
                                            />
                                        </td>
                                        <td className="test-execution-table-cell">
                                            <input
                                                type="date"
                                                value={test.tested_date || ""}
                                                onChange={(e) => handleInputChange(e, "tested_date", index)}
                                                className="test-execution-input-field"
                                            />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="text-center">No Test Procedures Found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <button className="test-execution-save-btn" onClick={handleSave}>Save</button>
        </div>
    );
};

export default TestExecution;
