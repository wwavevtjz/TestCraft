import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "./testcase_css/TestcaseVerifed.css";
import { Data } from "emoji-mart";
import trash_comment from "../../image/trash_comment.png";  // ไอคอนลบคอมเมนต์

const TestcaseVerifed = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get("project_id");
  const veriTestcaseId = queryParams.get("veritestcase_id");
  const { selectedTestcase = [] } = location.state || {};
  const [testcasecriList, setTestcasecriList] = useState([]);
  const [testcaseDetails, setTestcaseDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkboxState, setCheckboxState] = useState({});
  const [veritestcaseBy, setVeritestcaseBy] = useState({});
  const storedUsername = localStorage.getItem("username");
  const testcaseId = queryParams.get("testcase_id");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectId || !veriTestcaseId) {
      console.error("Project ID or Testcase ID is missing.");
      navigate("/VeriTestcase");
      return;
    }

    fetchCriteria();
    fetchTestcaseDetails(selectedTestcase);
    fetchVeriTestcaseBy();
  }, [projectId, veriTestcaseId, selectedTestcase, navigate]);

  useEffect(() => {
    fetchComments();
  }, [veriTestcaseId]);

  // ดึงข้อมูล veritestcase_by
  const fetchVeriTestcaseBy = async () => {
    try {
      const response = await axios.get("http://localhost:3001/testcaseveri", {
        params: { project_id: projectId, veritestcase_id: veriTestcaseId, testcase_id: testcaseId },
      });
      const veritestcase = response.data.find(
        (item) => item.id === veriTestcaseId
      );
      setVeritestcaseBy(veritestcase?.veritestcase_by || {});
    } catch (error) {
      console.error("Error fetching veritestcase_by:", error);
    }
  };

  const fetchCriteria = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3001/testcasecriteria/${projectId}`);
      const initialCheckboxState = response.data.reduce((acc, criteria) => {
        acc[criteria.testcasecri_id] = false;
        return acc;
      }, {});
      setTestcasecriList(response.data);
  
      const storedUsername = localStorage.getItem("username");
      if (storedUsername) {
        const storedCheckboxState = localStorage.getItem(
          `checkboxState_${storedUsername}_${projectId}_${veriTestcaseId}`
        );
        setCheckboxState(
          storedCheckboxState ? JSON.parse(storedCheckboxState) : initialCheckboxState
        );
      }
    } catch (error) {
      console.error("Error fetching testcase criteria:", error);
    } finally {
      setLoading(false);
    }
  };  

  const fetchTestcaseDetails = async () => {
    try {
      const response = await axios.get("http://localhost:3001/verifytestcase", {
        params: { testcase_id: testcaseId },
      });
      setTestcaseDetails(response.data);
    } catch (error) {
      console.error("Error fetching testcase details:", error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get("http://localhost:3001/get-commentveritestcase", {
        params: { veritestcase_id: veriTestcaseId },
      });
      setComments(response.data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleCheckboxChange = (id) => {
    setCheckboxState((prevState) => {
      const updatedState = { ...prevState, [id]: !prevState[id] };

      localStorage.setItem(
        `checkboxState_${storedUsername}_${projectId}_${veriTestcaseId}`,
        JSON.stringify(updatedState)
      );

      return updatedState;
    });
  };
  
      const handleSave = async () => {
          console.log("testcase_id:", testcaseId);
  
          if (!storedUsername) {
              toast.warning("ข้อมูล reviewer ขาดหาย กรุณารีเฟรชหน้า");
              return;
          }
  
          // ✅ ตรวจสอบว่า checklist ทั้งหมดถูกเลือก
          const allChecked = testcasecriList.every(criteria => checkboxState[criteria.testcasecri_id]);
          if (!allChecked) {
              toast.warning("กรุณาเลือกทุกข้อก่อนกด Save");
              return;
          }
  
          try {
              // 1️⃣ ดึงข้อมูลปัจจุบันของ veritestcase
              const { data } = await axios.get("http://localhost:3001/testcaseveri", {
                  params: { project_id: projectId, veritestcase_id: veriTestcaseId },
              });
  
              console.log("API Response Data:", data);
              if (!data.length) {
                  toast.error("ไม่พบข้อมูล veritestcase กรุณาตรวจสอบใหม่");
                  return;
              }
  
              const veritestcaseData = data[0];
  
              // 2️⃣ ตรวจสอบว่าข้อมูล reviewer มีอยู่แล้วหรือไม่
              let currentVeritestcaseBy = veritestcaseData.veritestcase_by || {};
  
              // 3️⃣ อัปเดต reviewer โดยไม่ลบคนอื่น
              const updatedVeritestcaseBy = { ...currentVeritestcaseBy, [storedUsername]: true };
  
              console.log("Updated veritestcase_by:", updatedVeritestcaseBy);
  
              // 4️⃣ ส่งข้อมูลอัปเดตไปยังเซิร์ฟเวอร์
              const response = await axios.put("http://localhost:3001/update-veritestcase-by", {
                  veritestcaseid: veriTestcaseId, // ✅ ต้องตรงกับ API
                  veritestcaseby: updatedVeritestcaseBy, // ✅ ส่งเป็น Object ตรง ๆ
              });
  
              console.log("📤 ส่งข้อมูลไปยัง API:", response.data);
  
              if (response.data.message.includes("ไม่พบข้อมูล")) {
                  toast.error("ไม่พบข้อมูล veritestcase ID กรุณาตรวจสอบใหม่");
                  return;
              }
  
              // 5️⃣ ตรวจสอบว่า reviewer ทุกคนตรวจสอบครบหรือยัง
              const { data: newData } = await axios.get("http://localhost:3001/testcaseveri", {
                  params: { project_id: projectId, veritestcase_id: veriTestcaseId },
              });
  
              console.log("Updated API Response Data:", newData);
  
              const allReviewed = newData[0].veritestcase_by &&
                  Object.values(newData[0].veritestcase_by).every(status => status === true);
  
              console.log("All Reviewed:", allReviewed);
  
              if (!allReviewed) {
                  toast.warning("ยังมี reviewer ที่ยังไม่ได้ทำการตรวจสอบ");
                  return;
              }
  
              const testcaseIdsArray = testcaseId.split(",").map(id => id.trim());
              if (testcaseIdsArray.length === 0) {
                  toast.error("ไม่พบข้อมูล testcase ID กรุณาตรวจสอบใหม่");
                  return;
              }
  
              // 6️⃣ ถ้า reviewer ทุกคนตรวจสอบแล้ว อัปเดตสถานะเป็น VERIFIED
              const updateStatusResponse = await axios.put("http://localhost:3001/update-testcase-status-verified", {
                  testcase_ids: testcaseIdsArray,
                  testcase_status: "VERIFIED",
              });
  
              if (updateStatusResponse.data.message.includes("VERIFIED successfully")) {
                  toast.success("อัปเดตสถานะเป็น VERIFIED สำเร็จ", {
                      autoClose: 1500,
                      onClose: () => navigate(`/Dashboard?project_id=${projectId}`),
                  });
              } else {
                  toast.error("ไม่สามารถอัปเดตสถานะ testcase ได้");
              }
          } catch (error) {
              console.error("Error updating verification status:", error);
              toast.error("ไม่สามารถอัปเดตสถานะได้ กรุณาลองใหม่");
          }
      };

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      setError("กรุณาใส่ข้อความก่อนโพสต์");
      return;
    }

    try {
      const response = await axios.post("http://localhost:3001/commentveritestcase", {
        member_name: storedUsername,
        comvertestcase_text: newComment,
        veritestcase_id: veriTestcaseId
      });

      if (response.status === 201) {
        setNewComment("");  // เคลียร์ช่องคอมเมนต์หลังจากโพสต์สำเร็จ
        fetchComments(); // โหลดคอมเมนต์ใหม่
        toast.success("The comment has been successfully added.",{
          autoClose: 2000,
        });
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("เกิดข้อผิดพลาดในการโพสต์คอมเมนต์");
    }
  };

  const handleDelete = async (comvertestcase_id) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      const response = await axios.delete(`http://localhost:3001/delete-commentveritestcase/${comvertestcase_id}`);

      if (response.status !== 200) {
        throw new Error(response.data.error || "Failed to delete comment");
      }

      toast.success("Comment deleted successfully", {
        autoClose: 2000,
      });

      // อัปเดตรายการคอมเมนต์หลังจากลบ
      setComments((prevComments) =>
        prevComments.filter((comment) => comment.comvertestcase_id !== comvertestcase_id)
      );
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Error deleting comment: " + error.message);
    }
  };

  return (
    <div className="testcaseveri-container">
      <h1 className="title-testcasever">Verification Requirement</h1>
      <div className="testcase-verified-container">
        {/* Checklist Section */}
        <div className="checklistveri-testcase-box">
          <h2 className="checklistveri-testcase-title">Testcase Verification Checklist</h2>
          {loading ? (
            <p className="checklistveri-testcase-loading">Loading...</p>
          ) : (
            <ul className="checklistveri-testcase-list">
              {testcasecriList.map((criteria) => (
                <li key={criteria.testcasecri_id} className="checklistveri-testcase-item">
                  <label className="checklistveri-testcase-label">
                    <input
                      type="checkbox"
                      className="checklistveri-testcase-checkbox"
                      checked={checkboxState[criteria.testcasecri_id] || false}
                      onChange={() => handleCheckboxChange(criteria.testcasecri_id)}
                    />
                    {criteria.testcasecri_name}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Comment Section */}
        <div className="commentveritestcase-box">
          <div className="commentveritestcase-section">
            <h2 className="commentveritestcase-title">Comments ({comments.length})</h2>

            {/* Post a new comment */}
            <div className="commentveritestcase-input-container">
              <textarea
                placeholder={`Add comment as ${storedUsername}...`}
                className="commentveritestcase-textarea"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button className="commentveritestcase-submit-button" onClick={handleSubmit}>
                Submit
              </button>
            </div>

            {/* Error Message */}
            {error && <p className="commentveritestcase-error-message">{error}</p>}

            {/* Display comments */}
            {comments.length === 0 ? (
              <p className="commentveritestcase-no-comments">No comments available at the moment.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.comvertestcase_id} className="commentveritestcase-item">
                  <div className="commentveritestcase-header">
                    <span className="commentveritestcase-name">{comment.member_name}</span>
                    <span className="commentveritestcase-time">{new Date(comment.comvertestcase_at).toLocaleString()}</span>
                  </div>
                  <p className="commentveritestcase-text">{comment.comvertestcase_text}</p>
                  <div className="commentveritestcase-footer">
                    <button
                      className="commentveritestcase-delete-button"
                      onClick={() => handleDelete(comment.comvertestcase_id)}
                    >
                      <img src={trash_comment} alt="Delete" className="commentveritestcase-trash" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>


      <div className="boxrequirement-testcaseveri">
        <h1 className="title-softwaretestcase">Testcase</h1>
        <table className="table-req-testcaseveri">
          <thead>
            <tr><th>ID</th><th>Testcase Name</th><th>Type</th></tr>
          </thead>
          <tbody>
            {testcaseDetails.length > 0 ? (
              testcaseDetails.map((testcase) => (
                <tr key={testcase.testcase_id}>
                  <td>TC-00{testcase.testcase_id}</td>
                  <td>{testcase.testcase_name || "N/A"}</td>
                  <td>{testcase.testcase_type || "N/A"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3">No testcase details found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="button-container">
        <button onClick={handleSave} className="savetestcaseveri-button">Save</button>
      </div>
    </div>
  );
};

export default TestcaseVerifed;