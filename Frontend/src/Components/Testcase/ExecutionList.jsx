import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // ใช้ useNavigate แทน Link
import axios from "axios";
import "./testcase_css/ExecutionList.css";

const ExecutionList = () => {
  const location = useLocation();
  const navigate = useNavigate(); // ใช้ navigate สำหรับเปลี่ยนหน้า
  const queryParams = new URLSearchParams(location.search);
  const project_id = queryParams.get("project_id");

  const [testExecutions, setTestExecutions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (project_id) {
      axios.get(`http://localhost:3001/api/testcase_executions?project_id=${project_id}`)
        .then((response) => setTestExecutions(response.data))
        .catch((error) => console.error("Error fetching test executions:", error));
    }
  }, [project_id]);

  const filteredExecutions = testExecutions.filter((execution) =>
    execution.testcase_id.toString().includes(searchTerm)
  );

  const handleNavigate = (testcase_id) => {
    console.log("Navigating to:", testcase_id);
    if (testcase_id) {
        navigate(`/TestExecution/${testcase_id}`);
    } else {
        console.error("testcase_id is undefined or null");
    }
};


  return (
    <div className="test-execution-container">
      <h2>Test Execution for Project {project_id}</h2>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by Test Case ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <table>
        <thead>
          <tr>
            <th>Test Case ID</th>
            <th>Test Title</th>
            <th>Test Status</th>
            <th>Completion Date</th>
            <th>Actions</th> {/* เพิ่มคอลัมน์สำหรับปุ่ม */}
          </tr>
        </thead>
        <tbody>
          {filteredExecutions.length > 0 ? (
            filteredExecutions.map((execution) => (
              <tr key={execution.test_execution_id}>
                <td>TC-{execution.testcase_id.toString().padStart(3, "0")}</td>
                <td>{execution.testcase_name || "N/A"}</td>
                <td>{execution.test_execution_status}</td>
                <td>{execution.testcase_at || "-"}</td>
                <td>
                  {/* ปุ่มเลือก Execution */}
                  <button onClick={() => handleNavigate(execution.testcase_id)}>
                    Execute
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="no-data">No test executions found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ExecutionList;
