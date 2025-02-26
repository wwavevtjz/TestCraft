import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "./testcase_css/TestExecution.css";

const TestExecution = () => {
    const location = useLocation();
    const { testCase } = location.state || {};
    const [testSteps, setTestSteps] = useState([]);

    const statusOptions = ["Passed", "Failed", "In Progress", "Blocked"];

    useEffect(() => {
        if (testCase) {
            axios
                .get(`http://localhost:3001/api/test_procedures/${testCase.testcase_id}`)
                .then((response) => setTestSteps(response.data))
                .catch((error) => console.error("Error fetching test procedures:", error));
        }
    }, [testCase]);

    if (!testCase) {
        return <div className="error-message">No Test Case Found!</div>;
    }

    const handleStatusChange = (index, event) => {
        const updatedTestSteps = [...testSteps];
        updatedTestSteps[index].test_status = event.target.value;
        setTestSteps(updatedTestSteps);
    };

    const handleActualResultChange = (index, event) => {
        const updatedTestSteps = [...testSteps];
        updatedTestSteps[index].actual_result = event.target.value;
        setTestSteps(updatedTestSteps);
    };

    const handleSave = () => {
        axios
            .post("http://localhost:3001/api/update_test_execution", { testSteps })
            .then(() => alert("Test Execution saved successfully!"))
            .catch((error) => console.error("Error saving test execution:", error));
    };

    const handleFileChange = (index, event) => {
        const file = event.target.files[0];
        if (!file) return;
    
        const formData = new FormData();
        formData.append("file", file);
        formData.append("test_procedures_id", testSteps[index].test_procedures_id);
        formData.append("testcase_id", testCase.testcase_id); // ✅ เพิ่ม testcase_id
    
        axios
            .post("http://localhost:3001/api/upload_test_file", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })
            .then((response) => {
                alert("File uploaded successfully!");
                const updatedTestSteps = [...testSteps];
                updatedTestSteps[index].file_testcase_name = response.data.file_testcase_name; // บันทึกชื่อไฟล์
                setTestSteps(updatedTestSteps);
            })
            .catch((error) => {
                console.error("Error uploading file:", error);
                alert("File upload failed!");
            });
    };
    



    return (
        <div className="TestExecution">
            <button className="save-button" onClick={handleSave}>Save</button>
            <h3>Test Execution : {`TC-0${testCase.testcase_id}`} {testCase.testcase_name}</h3>
            <p><strong>Completion Date:</strong> {new Date(testCase.testcase_at).toLocaleDateString("th-TH")}</p>
            <p><strong>Tested By:</strong> {testCase.tested_by}</p>

            <table className="test-execution-table">
                <thead>
                    <tr>
                        <th>Step No</th>
                        <th>Required Action</th>
                        <th>Expected Result</th>
                        <th>Prerequisite</th>
                        <th>Test Status</th>
                        <th>Actual Result</th>
                        <th>Attachments</th>
                    </tr>
                </thead>
                <tbody>
                    {testSteps.length > 0 ? (
                        testSteps.map((step, index) => (
                            <tr key={step.test_procedures_id} data-status={step.test_status || "default"}>
                                <td>{index + 1}</td>
                                <td>{step.required_action}</td>
                                <td>{step.expected_result}</td>
                                <td>{step.prerequisite || "-"}</td>
                                <td
                                    className={`status-cell ${step.test_status === "Passed" ? "passed" :
                                        step.test_status === "Failed" ? "failed" :
                                            step.test_status === "In Progress" ? "in-progress" :
                                                step.test_status === "Blocked" ? "blocked" : ""
                                        }`}
                                >
                                    <select
                                        value={step.test_status || ""}
                                        onChange={(event) => handleStatusChange(index, event)}
                                    >
                                        <option value="">Select Status</option>
                                        {statusOptions.map((status, idx) => (
                                            <option key={idx} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </select>
                                </td>


                                <td>
                                    <input
                                        type="text"
                                        value={step.actual_result || ""}
                                        onChange={(event) => handleActualResultChange(index, event)}
                                    />
                                </td>
                                <td>
                                    <input type="file" onChange={(event) => handleFileChange(index, event)} />
                                    {step.file_testcase_name && <p>{step.file_testcase_name}</p>}
                                </td>

                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="7" className="no-data"> No Test Procedures Found</td>
                        </tr>
                    )}
                </tbody>

            </table>
        </div>
    );
};

export default TestExecution;
