import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Eye, Edit, Trash } from "lucide-react";
import "./testcase_css/ExecutionList.css";

const ExecutionList = () => {
  const [testCases, setTestCases] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("http://localhost:3001/testexecution")
      .then(response => {
        // สร้าง object map เพื่อจัดกลุ่ม test cases ตาม objective
        const groupedCases = {};
        response.data.forEach(tc => {
          if (!groupedCases[tc.objective]) {
            groupedCases[tc.objective] = {
              id: `TC-00${tc.id}`,
              objective: tc.objective,
              priority: tc.priority,
              status: tc.status
            };
          }
        });
  
        setTestCases(Object.values(groupedCases));
      })
      .catch(error => console.error("Error fetching test cases:", error));
  }, []);
  

  const handleView = (testCase) => {
    console.log("🔍 Navigating to TestExecution with ID:", testCase.id);
    navigate(`/TestExecution/${testCase.id}`, { state: { testCase } });
};


  const filteredCases = testCases.filter(tc =>
    tc.objective.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container">
      <div className="header">
        <h1>Test Execution</h1>
        <button className="execution-button">Execution</button>
      </div>
      <input
        type="text"
        placeholder="Search"
        className="search-box"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Test Case ID</th>
              <th>Test Objective</th>
              <th>Priority</th>
              <th>Test Status</th>
              <th className="actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCases.map((tc, index) => (
              <tr key={index}>
                <td>{tc.id}</td>
                <td>{tc.objective}</td>
                <td>{tc.priority}</td>
                <td className="status">{tc.status}</td>
                <td className="actions">
                  <Eye className="icon view" onClick={() => handleView(tc)} />
                  <Edit className="icon edit" />
                  <Trash className="icon delete" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExecutionList;
