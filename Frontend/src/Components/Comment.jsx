import React, { useState, useEffect } from "react";
import axios from "axios";
import "./CSS/Comment.css";
import trash_comment from "../image/trash_comment.png";

const Comment = () => {
  const [comments, setComments] = useState([]); // เก็บข้อมูลคอมเมนต์
  const [newComment, setNewComment] = useState(""); // เก็บคอมเมนต์ใหม่
  const [loading, setLoading] = useState(true); // สถานะการโหลด
  const [loggedInUser, setLoggedInUser] = useState(""); // เก็บชื่อผู้ใช้งานที่ล็อกอิน
  const [memberId, setMemberId] = useState(null); // เก็บ member_id ของผู้ใช้ที่ล็อกอิน
  const [error, setError] = useState(""); // เก็บข้อความแสดงข้อผิดพลาด

  // ดึงข้อมูลผู้ใช้งานจาก localStorage
  useEffect(() => {
    const fetchLoggedInUser = () => {
      const userId = localStorage.getItem("user_id"); // ดึง member_id จาก localStorage
      const username = localStorage.getItem("username"); // ดึง username จาก localStorage
      setLoggedInUser(username || "Guest");
      setMemberId(userId || null);
    };

    fetchLoggedInUser();
  }, []); // ดึงข้อมูลผู้ใช้งานแค่ครั้งเดียวตอนที่ component โหลด

  // ฟังก์ชันสำหรับดึงข้อมูลคอมเมนต์เมื่อโหลดหน้าครั้งแรก
  const fetchComments = async () => {
    try {
      const response = await axios.get("http://localhost:3001/allcomment"); // ดึงข้อมูลคอมเมนต์จาก Backend
      setComments(response.data); // ตั้งค่าคอมเมนต์ใน state
    } catch (error) {
      console.error("Error fetching comments:", error);
      setError("Failed to load comments. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // เรียกใช้ฟังก์ชัน fetchComments เมื่อ component โหลด
  useEffect(() => {
    fetchComments();
  }, []); // Empty dependency array means this will run only once when the component mounts.

  // ฟังก์ชันสำหรับโพสต์คอมเมนต์ใหม่
  const handleSubmit = async () => {
    if (!newComment.trim()) {
      alert("Please enter a comment!");
      return;
    }

    try {
      const payload = {
        member_id: 1, // ID ผู้ใช้งาน (ปรับให้เหมาะสม)
        member_name: loggedInUser, // ชื่อผู้ใช้งาน
        comment_text: newComment, // ข้อความคอมเมนต์
      };

      console.log("Sending payload:", payload); // ตรวจสอบข้อมูลที่ส่งไป

      const response = await axios.post("http://localhost:3001/comments", payload);

      if (response.status === 201) {
        console.log("Response from server:", response.data); // ดูข้อมูลตอบกลับ
        setNewComment(""); // เคลียร์ข้อความใน textarea

        // เรียกใช้ฟังก์ชัน fetchComments เพื่อดึงข้อมูลคอมเมนต์ล่าสุด
        fetchComments();
      }
    } catch (error) {
      console.error("Error adding comment:", error); // แสดงข้อผิดพลาด
      alert("Failed to post comment.");
    }
  };

  const handleDelete = async (commentId) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        const response = await axios.delete(`http://localhost:3001/deletecomment/${commentId}`);
        if (response.status === 200) {
          console.log("Comment deleted successfully");
          fetchComments(); // รีเฟรชคอมเมนต์หลังจากลบ
        }
      } catch (error) {
        console.error("Error deleting comment:", error);
        alert("Failed to delete comment.");
      }
    }
  };




  const formatDate = (dateString) => {
    const date = new Date(dateString); // แปลงวันที่จาก string เป็น Date object
    return date.toLocaleString("en-US", {
      year: "numeric", // ปี (เช่น 2025)
      month: "long", // เดือน (เช่น "January")
      day: "numeric", // วันที่ (เช่น 19)
      hour: "numeric", // ชั่วโมง (เช่น 5)
      minute: "numeric", // นาที (เช่น 38)
      hour12: true, // ใช้เวลาแบบ 12 ชั่วโมง (AM/PM)
    });
  };

  return (
    <div className="comment-section">
      <h2 className="comment-title">Comments ({comments.length})</h2>
      <div className="comment-input">
        <textarea
          placeholder={`Add comment as ${loggedInUser}...`} // แสดงชื่อผู้ใช้ใน placeholder
          className="comment-textarea"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <button className="submit-button" onClick={handleSubmit}>
          Submit
        </button>
      </div>
      {error && <p className="error-message">{error}</p>}
      {loading ? (
        <p>Loading comments...</p>
      ) : (
        comments.map((comment) => { // แก้ไขตรงนี้ให้ไม่ต้องใช้ {} ครอบ map
          console.log(comment); // ตรวจสอบข้อมูลของ comment
          return (
            <div key={comment.member_id} className="comment">
              <div className="comment-header">
                <span className="comment-name">{comment.member_name}</span>
                <span className="comment-time">{formatDate(comment.comment_at)}</span> {/* แสดงวันที่ในรูปแบบที่เข้าใจง่าย */}
              </div>
              <p className="comment-text">{comment.comment_text}</p>
              <div className="comment-footer">
                <button className="like-button">👍 {comment.likes}</button>
                <button className="reply-button">💬 {comment.replies} </button>
                <button className="delete-comment-button" onClick={() => handleDelete(comment.comment_id)}>
                  <img src={trash_comment} alt="trash_comment" className="trash_comment" />
                </button>
              </div>
            </div>
          );
        })
      )}

    </div>
  );
};

export default Comment;
