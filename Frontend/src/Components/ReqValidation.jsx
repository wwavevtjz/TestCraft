import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./CSS/ReqValidation.css";
import trash_comment from "../image/trash_comment.png";  // ไอคอนลบคอมเมนต์

const ReqValidation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ดึง project_id และ validation_id จาก URL
  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get("project_id");
  const validationId = queryParams.get("validation_id");

  const { selectedRequirements } = location.state || {};  
  const [requirementsDetails, setRequirementsDetails] = useState([]);
  
  // คอมเมนต์
  const [comments, setComments] = useState([]); // เก็บข้อมูลคอมเมนต์
  const [newComment, setNewComment] = useState(""); // เก็บคอมเมนต์ใหม่ที่ต้องการโพสต์
  const [loading, setLoading] = useState(true); // สถานะการโหลดคอมเมนต์
  const [loggedInUser, setLoggedInUser] = useState(""); // ชื่อผู้ใช้งานที่ล็อกอิน
  const [error, setError] = useState(""); // ข้อความข้อผิดพลาด

  useEffect(() => {
    const fetchLoggedInUser = () => {
      const username = localStorage.getItem("username"); // ชื่อผู้ใช้งาน
      setLoggedInUser(username || "Guest");
    };
    fetchLoggedInUser();
  }, []);

  // ฟังก์ชันดึงคอมเมนต์จาก validation_id
  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3001/showvalicomment", {  // URL ที่แก้ไขใหม่
        params: { validation_id: validationId }, // ส่ง validation_id เพื่อดึงคอมเมนต์
      });
      setComments(response.data);
    } catch (error) {
      setError("Failed to load comments. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (validationId) {
      fetchComments(); // รีเฟรชคอมเมนต์เมื่อ validationId เปลี่ยน
    }
  }, [validationId]);

  // ฟังก์ชันโพสต์คอมเมนต์ใหม่
  const handleSubmit = async () => {
    if (!newComment.trim()) {
      alert("Please enter a comment!");
      return;
    }
  
    try {
      const payload = {
        member_name: loggedInUser, // ชื่อผู้ใช้งาน
        comment_var_text: newComment, // ข้อความคอมเมนต์
        validation_id: validationId, // ส่ง validation_id เพื่อเชื่อมโยงกับคอมเมนต์
      };
  
      const response = await axios.post("http://localhost:3001/createvarcomment", payload);
      if (response.status === 201) {
        setNewComment(""); // เคลียร์ข้อความคอมเมนต์
        fetchComments(); // รีเฟรชคอมเมนต์หลังจากเพิ่มคอมเมนต์ใหม่
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to post comment.");
    }
  };
  
  // ฟังก์ชันลบคอมเมนต์
  const handleDelete = async (commentId) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        const response = await axios.delete(`http://localhost:3001/deletecomment/${commentId}`);
        if (response.status === 200) {
          fetchComments(); // รีเฟรชคอมเมนต์หลังจากลบ
        }
      } catch (error) {
        alert("Failed to delete comment.");
      }
    }
  };

  // ฟังก์ชันสำหรับการจัดรูปแบบวันที่
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  // ดึงข้อมูลของ requirements ที่เชื่อมโยง
  useEffect(() => {
    if (!projectId || !validationId) {
      console.error("Project ID or Validation ID is missing");
      navigate("/ValidationList");
      return;
    }

    if (selectedRequirements && selectedRequirements.length > 0) {
      fetchRequirementsDetails(selectedRequirements);
    }
  }, [projectId, validationId, selectedRequirements, navigate]);

  const fetchRequirementsDetails = async (requirements) => {
    try {
      const response = await axios.get("http://localhost:3001/requirements", {
        params: { requirement_ids: requirements },
      });
      setRequirementsDetails(response.data);
    } catch (error) {
      console.error("Error fetching requirements:", error);
    }
  };

  const handleSave = async () => {
    if (!projectId || requirementsDetails.length === 0) {
      alert("Project ID or requirements details are missing. Cannot update status.");
      return;
    }

    try {
      const requirementIds = requirementsDetails.map((req) => req.requirement_id);

      await axios.put("http://localhost:3001/update-requirements-status-validated", {
        requirement_ids: requirementIds,
        requirement_status: "VALIDATED",
      });

      alert("Status updated to VALIDATED successfully.");
      navigate(`/Dashboard?project_id=${projectId}`);
    } catch (error) {
      alert("Failed to update status.");
    }
  };

  return (
    <div className="container">
      <h1 className="title">Validation Requirement</h1>

      {/* ส่วนแสดง Requirement */}
      <div className="box requirements">
        <h2>Requirement</h2>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Requirements Statement</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {requirementsDetails.length > 0 ? (
              requirementsDetails.map((req, index) => (
                <tr key={index}>
                  <td>REQ-0{req.requirement_id}</td>
                  <td>{req.requirement_name}</td>
                  <td>{req.requirement_type}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3">No requirements details found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ส่วนแสดงคอมเมนต์ */}
      <div className="comment-section">
        <h2>Comments ({comments.length})</h2>

        {/* พื้นที่สำหรับโพสต์คอมเมนต์ใหม่ */}
        <div className="comment-input">
          <textarea
            placeholder={`Add comment as ${loggedInUser}...`}
            className="comment-textarea"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button className="submit-button" onClick={handleSubmit}>
            Submit
          </button>
        </div>

        {/* ข้อความแสดงข้อผิดพลาดถ้ามี */}
        {error && <p className="error-message">{error}</p>}

        {/* การแสดงคอมเมนต์ */}
        {loading ? (
          <p>Loading comments...</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.comment_id} className="comment">
              <div className="comment-header">
                <span className="comment-name">{comment.member_name}</span>
                <span className="comment-text">{comment.comment_var_text}</span>
                <span className="comment-time">{formatDate(comment.comment_var_at)}</span>
              </div>
              <p className="comment-text">{comment.comment_text}</p>
              <div className="comment-footer">
                <button className="like-button">👍 {comment.likes}</button>
                <button className="reply-button">💬 {comment.replies}</button>
                <button className="delete-comment-button" onClick={() => handleDelete(comment.comment_id)}>
                  <img src={trash_comment} alt="trash_comment" className="trash_comment" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ปุ่ม Save */}
      <div className="button-container">
        <button className="save-button" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
};

export default ReqValidation;
