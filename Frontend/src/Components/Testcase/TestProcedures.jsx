import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faSave, faTrash } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import "./testcase_css/TestProcedures.css";

// ตัวเลือกสถานะของ Test Step
const statusOptions = [
  "Not Start",
  "In Progress",
  "Passed",
  "Passed with Condition",
  "Failed",
  "Cancelled"
];

const TestProcedures = () => {
  const [procedures, setProcedures] = useState([]);
  const [newSteps, setNewSteps] = useState([]);
  const [editingRow, setEditingRow] = useState(null);
  const [existingObjectives, setExistingObjectives] = useState([]);
  
  // ดึง testcase_id จาก URL
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const testcaseId = queryParams.get("testcase_id");

  // โหลดข้อมูล Test Procedures จาก API
  useEffect(() => {
    if (!testcaseId) return;

    axios
      .get(`http://localhost:3001/api/test-procedures?testcase_id=${testcaseId}`)
      .then((response) => {
        console.log("Fetched Data:", response.data); // ✅ Debug

        const filteredData = response.data.map(({ testcase_id, ...rest }) => rest);
        setProcedures(filteredData);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, [testcaseId]);


  // เพิ่ม Test Step ใหม่
  const handleAddStep = () => {
    const newProcedure = {
      test_objective: "",
      test_condition: "",
      test_step: "",
      expected_result: "",
      test_data: "",
      test_status: "Not start",
      tested_by: "",
    };
    setNewSteps([...newSteps, newProcedure]);
  };

  // บันทึกข้อมูลของแถวที่เพิ่มหรือแก้ไข
  const handleSaveRow = async (rowIndex, isEditing = false) => {
    try {
      let updatedProcedures = [...procedures];
      let proc = isEditing ? updatedProcedures[rowIndex] : newSteps[rowIndex];

      console.log("Saving Procedure:", proc);  // ✅ Debug: ดูว่ามี test_procedures_id หรือไม่

      if (isEditing) {
        if (!proc.test_procedures_id) {
          alert("Error: Missing test_procedures_id");
          return;
        }

        await axios.put(`http://localhost:3001/api/test-procedures/${proc.test_procedures_id}`, proc);

        updatedProcedures[rowIndex] = { ...proc };
        setProcedures(updatedProcedures);
      } else {
        const response = await axios.post("http://localhost:3001/api/test-procedures", {
          testcase_id: testcaseId,
          ...proc,
        });

        setProcedures([...procedures, response.data]);
        setNewSteps(newSteps.filter((_, index) => index !== rowIndex));
      }

      setEditingRow(null);
      alert("Saved successfully!");
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Save failed!");
    }
  };




  // ลบ Test Step
  const handleDeleteStep = async (rowIndex, isEditing = false) => {
    try {
      if (isEditing) {
        const procId = procedures[rowIndex]?.test_procedures_id; // เช็คว่า ID มีค่าหรือไม่
        if (!procId) {
          alert("Error: Missing test_procedures_id");
          console.error("Error: test_procedures_id is undefined");
          return;
        }

        console.log("Deleting ID:", procId); // ✅ Debug ID

        await axios.delete(`http://localhost:3001/api/test-procedures/${procId}`);
        setProcedures(procedures.filter((_, i) => i !== rowIndex));
      } else {
        setNewSteps(newSteps.filter((_, i) => i !== rowIndex));
      }

      alert("Deleted successfully!");
    } catch (error) {
      console.error("Error deleting data:", error.response?.data || error.message);
      alert("Delete failed!");
    }
  };



  // แก้ไขค่าของเซลล์ในตาราง
  const handleEditCell = (list, setList, rowIndex, field, value) => {
    setList((prevList) => {
      const updatedList = [...prevList];
      updatedList[rowIndex] = { ...updatedList[rowIndex], [field]: value };
      return updatedList;
    });
  };


  // ปิดการแก้ไขเมื่อคลิกนอกตาราง
  const handleBlur = (e) => {
    // ตรวจสอบว่าไม่ได้คลิกภายในตาราง
    if (!e.currentTarget.contains(document.activeElement)) {
      // ตรวจสอบว่าแถวที่กำลังแก้ไขมีการเปลี่ยนแปลงหรือไม่
      const isEditingRowChanged = editingRow !== null && procedures[editingRow] !== undefined;
  
      // ตรวจสอบว่าแถวที่เพิ่มใหม่มีการกรอกข้อมูลหรือไม่
      const isNewStepsFilled = newSteps.some((step) => 
        step.test_objective.trim() !== "" ||
        step.test_condition.trim() !== "" ||
        step.test_step.trim() !== "" ||
        step.expected_result.trim() !== ""
      );
  
      // ถ้ามีการแก้ไขหรือเพิ่มใหม่ที่ยังไม่ได้บันทึก
      if (isEditingRowChanged || isNewStepsFilled) {
        const confirmSave = window.confirm("Do you want to save changes before leaving?");
        if (confirmSave) {
          // บันทึกแถวที่กำลังแก้ไข
          if (isEditingRowChanged) {
            handleSaveRow(editingRow, true);
          }
          // บันทึกแถวที่เพิ่มใหม่
          if (isNewStepsFilled) {
            newSteps.forEach((_, index) => handleSaveRow(index));
          }
        } else {
          // ยกเลิกการแก้ไขหรือเพิ่มใหม่
          setEditingRow(null);
          setNewSteps([]);
        }
      }
    }
  };
  return (
    <div className="test-procedures-container" onClick={handleBlur}>
      {/* Header */}
      <div className="test-procedures-header">
        <h3>Test Procedures</h3>
        <button className="add-test-step-btn" onClick={handleAddStep}>
          <FontAwesomeIcon icon={faPlus} /> Add Test Step
        </button>
      </div>
  
      {/* Table */}
      <div className="table-wrapper">
        <table className="test-procedures-table">
          <thead>
            <tr>
              <th>Test Objective</th>
              <th>Test Condition</th>
              <th>Test Steps</th>
              <th>Expected Result</th>
              <th>Test Data</th>
              <th>Status</th>
              <th>Tested By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* แสดงแถวใหม่ที่เพิ่ม */}
            {newSteps.map((proc, rowIndex) => (
              <tr key={`new-${rowIndex}`}>
                {Object.entries(proc).map(([field, value], colIndex) =>
                  field !== "test_procedures_id" ? (
                    <td key={colIndex}>
                      {["test_data", "test_status", "tested_by"].includes(field) ? (
                        <span>{value}</span> // ❌ ปิดการแก้ไข
                      ) : (
                        <input
                          type="text"
                          className="test-procedures-input"
                          value={value}
                          onChange={(e) =>
                            handleEditCell(newSteps, setNewSteps, rowIndex, field, e.target.value)
                          }
                        />
                      )}
                    </td>
                  ) : null
                )}
                <td>
                  <button onClick={() => handleSaveRow(rowIndex)} className="save-btn">
                    <FontAwesomeIcon icon={faSave} />
                  </button>
                  <button onClick={() => handleDeleteStep(rowIndex)} className="delete-btn">
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </td>
              </tr>
            ))}
  
            {/* แสดงแถวที่มีอยู่แล้ว */}
            {procedures.map((proc, rowIndex) => (
              <tr key={`existing-${rowIndex}`}>
                {Object.entries(proc).map(([field, value], colIndex) =>
                  field !== "test_procedures_id" ? (
                    <td
                      key={colIndex}
                      onDoubleClick={() => {
                        if (!["test_data", "test_status", "tested_by"].includes(field)) {
                          setEditingRow(rowIndex);
                        }
                      }}
                    >
                      {editingRow === rowIndex && !["test_data", "test_status", "tested_by"].includes(field) ? (
                        <input
                          type="text"
                          className="test-procedures-input"
                          value={value}
                          onChange={(e) =>
                            handleEditCell(procedures, setProcedures, rowIndex, field, e.target.value)
                          }
                        />
                      ) : (
                        <span>{value}</span> // ❌ ปิดการแก้ไข
                      )}
                    </td>
                  ) : null
                )}
                <td>
                  {editingRow === rowIndex && (
                    <>
                      <button onClick={() => handleSaveRow(rowIndex, true)} className="save-btn">
                        <FontAwesomeIcon icon={faSave} />
                      </button>
                      <button onClick={() => handleDeleteStep(rowIndex, true)} className="delete-btn">
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TestProcedures;