import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import notverify from "../../image/notverify.png";
import verifydone from "../../image/verifydone.png";
import "./testcase_css/VeriTestcase.css";
import "../CSS/VeriDesign.css";
import "../CSS/buttons/buttons.css";

const Modal = ({ show, onClose, details = {}, veritestcaseBy = [] }) => {
  if (!show) return null;

  // Ensure that testcaseId is always an array
  const testcaseId = Array.isArray(details.testcase_id) ? details.testcase_id : [details.testcase_id];

  return (
    <div className="modal-overlay-review">
      <div className="modal-content-review">
        <h3>Testcase Details</h3>
        <div>
        <p>
  <strong>Testcase ID:</strong> 
  {testcaseId && testcaseId.length > 0 ? testcaseId.join(", ") : "N/A"}
</p>

          <p><strong>Created By:</strong> {details.created_by}</p>
        </div>

        <h3>Verification Status</h3>
        {veritestcaseBy.length > 0 ? (
          veritestcaseBy.map((reviewer, index) => (
            <div className="list-reviewer" key={index}>
              <span>{reviewer.name}</span>
              <img
                src={reviewer.value ? verifydone : notverify}
                alt={reviewer.value ? "Verified" : "Not Verified"}
                className="verification-status-icon"
              />
            </div>
          ))
        ) : (
          <div>No verification by users found.</div>
        )}

        <button className="close-modal-review-button" onClick={onClose}>✖ Close</button>
      </div>
    </div>
  );
};

const VeriTestcase = () => {
  const [testcase, setTestcase] = useState([]);
  const [selectedTestcase, setSelectedTestcase] = useState({});
  const [assignedReviewers, setAssignedReviewers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get("project_id");

  const fetchTestcase = useCallback(() => {
    axios
      .get(`http://localhost:3001/verilisttestcase?project_id=${projectId}`)
      .then((response) => {
        console.log("Fetched Testcase:", response.data);

        // Group testcase ตาม veritestcase_round
        const groupedTestcase = response.data.reduce((acc, testcase) => {
          const round = testcase.veritestcase_round;
          // ถ้ายังไม่มี key นี้ใน accumulator ให้สร้าง object ใหม่
          if (!acc[round]) {
            acc[round] = {
              ...testcase,
              // เก็บ testcase_id ในรูปแบบ Array
              testcase_id: Array.isArray(testcase.testcase_id)
                ? testcase.testcase_id
                : [testcase.testcase_id],
              // แปลง veritestcase_by ให้เป็น Array ถ้าเป็น Object
              veritestcase_by:
                typeof testcase.veritestcase_by === "object"
                  ? Object.entries(testcase.veritestcase_by).map(([name, value]) => ({
                    name,
                    value: value === true, // ตรวจสอบให้แน่ใจว่าค่าเป็น Boolean
                  }))
                  : testcase.veritestcase_by,
            };
          } else {
            // ถ้ามี key นี้อยู่แล้ว ให้นำ testcase_id ใหม่ไปต่อท้าย array เดิม
            acc[round].testcase_id.push(testcase.testcase_id);
            // รวม veritestcase_by โดยการ merge แล้ว deduplicate (กรณี reviewer ซ้ำกัน)
            if (typeof testcase.veritestcase_by === "object") {
              const newVeri = Object.entries(testcase.veritestcase_by).map(
                ([name, value]) => ({ name, value: value === true })
              );
              const combined = [...acc[round].veritestcase_by, ...newVeri];
              // ดำเนินการ deduplicate โดยใช้ชื่อ reviewer เป็น key
              const deduped = [];
              const reviewerNames = new Set();
              combined.forEach((item) => {
                if (!reviewerNames.has(item.name)) {
                  reviewerNames.add(item.name);
                  deduped.push(item);
                }
              });
              acc[round].veritestcase_by = deduped;
            }
          }
          return acc;
        }, {});

        // เปลี่ยน object กลุ่มให้เป็น array
        const processedTestcase = Object.values(groupedTestcase)
          // ตัวอย่างกรองเฉพาะสถานะที่ "WAITING FOR VERIFICATION"
          .filter((testcase) => testcase.testcase_status === "WAITING FOR VERIFICATION");

        console.log("Processed testcase:", processedTestcase);
        setTestcase(processedTestcase);
      })
      .catch((err) => {
        console.error("Error fetching testcase:", err);
        toast.error("Error fetching testcase.");
      });
  }, [projectId]);


  useEffect(() => {
    fetchTestcase();
  }, [fetchTestcase]);

  const handleSearchClick = (testcase, veritestcaseBy) => {
    setSelectedTestcase(testcase || {});
    setAssignedReviewers(veritestcaseBy || []);
    setShowModal(true);
  };
  


  const handleVerifyClick = (testcase) => {
    if (!projectId || !testcase?.testcase_id || !testcase?.veritestcase_id) {
      toast.error("Invalid project ID or no testcase selected.");
      return;
    }

    // ตรวจสอบว่า testcase_id เป็น array หรือไม่
    const testcaseIds = Array.isArray(testcase.testcase_id) ? testcase.testcase_id : [testcase.testcase_id];
    const testcaseId = testcaseIds.join(",");

    // ตรวจสอบว่ามี testcase_id หรือไม่ก่อนส่งไป
    if (!testcaseId) {
      toast.error("Testcase ID ไม่พบ กรุณาตรวจสอบใหม่");
      return;
    }

    const veritestcaseId = testcase.veritestcase_id;  // Get veritestcase_id
    navigate(`/TestcaseVerifed?project_id=${projectId}&testcase_id=${testcaseId}&veritestcase_id=${veritestcaseId}`, {
      state: { selectedTestcase: testcaseIds }
    });
  };




  return (
    <div className="testcase-list-container">
      <h1 className="testcase-list">Testcase List</h1>
      {testcase.length === 0 ? (
        <p>No testcase available.</p>
      ) : (
        <table className="testcase-table">
          <thead>
            <tr>
              <th>Round</th>
              <th>Created By</th>
              <th>Date</th>
              <th>Status</th>
              <th>Reviewers</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {testcase.map((testcase) => (
              <tr key={testcase.veritestcase_round}>
                <td>{testcase.veritestcase_round}</td>
                <td>{testcase.create_by}</td>
                <td>{new Date(testcase.veritestcase_at).toLocaleDateString()}</td>
                <td>{testcase.testcase_status || ""}</td>
                <td>
                  <button
                    className="search-icon-button"
                    title="View Reviewers"
                    onClick={() =>
                      handleSearchClick(
                        {
                            testcase_id: testcase.testcase_id,
                            testcase_status: testcase.testcase_status,
                          created_by: testcase.create_by,
                        },
                        testcase.veritestcase_by // ส่งข้อมูลที่ถูกแปลงแล้ว
                      )
                    }
                  >
                    🔍
                  </button>
                </td>
                <td>
                  <button className='Verify-button' onClick={() => handleVerifyClick(testcase)}>Verify</button>
                </td>
              </tr>
            ))}
          </tbody>


        </table>
      )}

      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        details={selectedTestcase}
        veritestcaseBy={assignedReviewers}
      />
    </div>
  );
};


export default VeriTestcase;
