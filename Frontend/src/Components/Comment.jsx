import React, { useState, useEffect } from "react";
import axios from "axios";
import "./CSS/Comment.css";

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
  }, []);

  // ดึงข้อมูลคอมเมนต์เมื่อโหลดหน้าครั้งแรก
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:3001/comments"); // ดึงข้อมูลคอมเมนต์จาก Backend
        setComments(response.data);
      } catch (error) {
        console.error("Error fetching comments:", error);
        setError("Failed to load comments. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, []);

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
        setComments((prevComments) => [
          ...prevComments,
          {
            id: response.data.comme_member_id,
            name: loggedInUser,
            time: "Just now",
            text: newComment,
            likes: 0,
            replies: 0,
          },
        ]);
        setNewComment("");
      }
    } catch (error) {
      console.error("Error adding comment:", error); // แสดงข้อผิดพลาด
      alert("Failed to post comment.");
    }
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
        comments.map((comment) => (
          <div key={comment.id} className="comment">
            <div className="comment-header">
              <span className="comment-name">{comment.name}</span>
              <span className="comment-time">{comment.time}</span>
            </div>
            <p className="comment-text">{comment.text}</p>
            <div className="comment-footer">
              <button className="like-button">👍 {comment.likes}</button>
              <button className="reply-button">💬 {comment.replies} Reply</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Comment;
