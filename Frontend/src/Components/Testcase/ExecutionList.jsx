import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./testcase_css/ExecutionList.css";

const ExecutionList = () => {
  const [testExecutions, setTestExecutions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:3001/api/testcase_executions")
      .then((response) => setTestExecutions(response.data))
      .catch((error) =>
        console.error("Error fetching test executions:", error)
      );
  }, []);

  const handleRowClick = (execution) => {
    navigate(`/TestExecution/${execution.testcase_id}`, { state: { testCase: execution } });
  };

  const filteredExecutions = testExecutions.filter((execution) =>
    execution.testcase_id.toString().includes(searchTerm)
  );

  return (
    <div className="test-execution-container">
      <h2>Test Case Executions</h2>
      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search by Test Case ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <table className="execution-table">
        <thead>
          <tr>
            <th>Test Case ID</th>
            <th>Test Name</th>
            <th>Test Status</th>
            <th>Completion Date</th>
          </tr>
        </thead>
        <tbody>
          {filteredExecutions.length > 0 ? (
            filteredExecutions.map((execution) => {
              const createdAt = execution.testcase_at
                ? new Date(execution.testcase_at).toLocaleDateString("th-TH")
                : "-";

              return (
                <tr key={execution.testcase_id} onClick={() => handleRowClick(execution)} style={{ cursor: "pointer" }}>
                  <td>TC-{execution.testcase_id.toString().padStart(3, "0")}</td>
                  <td>{execution.testcase_name || "N/A"}</td>
                  <td>{execution.test_execution_status || "N/A"}</td>
                  <td>{createdAt}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="4" className="no-data">❌ No test executions found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ExecutionList;
