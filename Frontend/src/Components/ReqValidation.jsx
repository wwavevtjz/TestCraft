import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./CSS/ReqValidation.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ReqValidation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get("project_id");
  const validationId = queryParams.get("validation_id");

  const { selectedRequirements } = location.state || {};
  const [requirementsDetails, setRequirementsDetails] = useState([]);
  const [attachedFile, setAttachedFile] = useState(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const loggedInUser = localStorage.getItem("username");

  // Fetch requirements and validate query params
  useEffect(() => {
    if (!projectId || !validationId) {
      toast.error("Project ID or Validation ID is missing.");
      navigate("/ValidationList");
      return;
    }

    if (selectedRequirements && selectedRequirements.length > 0) {
      fetchRequirementsDetails(selectedRequirements);
    } else {
      toast.warn("No selected requirements found.");
    }

    fetchComments();
  }, [projectId, validationId, selectedRequirements, navigate]);

  const fetchRequirementsDetails = async (requirements) => {
    try {
      const response = await axios.get("http://localhost:3001/requirements", {
        params: { requirement_ids: requirements },
      });
      setRequirementsDetails(response.data);
    } catch (error) {
      console.error("Error fetching requirements:", error);
      toast.error("Failed to fetch requirements details.");
    }
  };

  const handleSave = async () => {
    if (!projectId || requirementsDetails.length === 0) {
      toast.warn("Project ID or requirements details are missing.");
      return;
    }

    try {
      const requirementIds = requirementsDetails.map((req) => req.requirement_id);
      await axios.put("http://localhost:3001/update-requirements-status-validated", {
        requirement_ids: requirementIds,
        requirement_status: "VALIDATED",
      });
      toast.success("Status updated to VALIDATED successfully.");
      navigate(`/Dashboard?project_id=${projectId}`);
    } catch (error) {
      console.error("Error updating status:", error.response || error.message);
      toast.error("Failed to update status.");
    }
  };

  const handleFileChange = (event) => {
    setAttachedFile(event.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!attachedFile) {
      toast.warn("Please select a file to upload.");
      return;
    }

    setFileUploading(true);

    const formData = new FormData();
    formData.append("file", attachedFile);
    formData.append("title", attachedFile.name);
    formData.append("project_id", projectId);
    formData.append("requirement_id", JSON.stringify(selectedRequirements));

    try {
      const response = await axios.post("http://localhost:3001/uploadfile-var", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("File uploaded successfully.");
      setAttachedFile(null);
      setUploadedFiles((prevFiles) => [...prevFiles, response.data]);
    } catch (error) {
      console.error("Error uploading file:", error.response || error.message);
      toast.error("Failed to upload file.");
    } finally {
      setFileUploading(false);
    }
  };

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3001/showvalicomment", {
        params: { validation_id: validationId },
      });
      setComments(response.data);
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) {
      alert("Please enter a comment!");
      return;
    }

    try {
      const payload = {
        member_name: loggedInUser,
        comment_var_text: newComment,
        validation_id: validationId,
      };

      const response = await axios.post("http://localhost:3001/createvarcomment", payload);
      if (response.status === 201) {
        setNewComment("");
        fetchComments();
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to post comment.");
    }
  };

  const handleCommentDelete = async (commentId) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        const response = await axios.delete(`http://localhost:3001/deletecomment/${commentId}`);
        if (response.status === 200) {
          fetchComments();
        }
      } catch (error) {
        alert("Failed to delete comment.");
      }
    }
  };

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

  const renderComments = () => (
    <div className="comment-section">
      <h2>Comments</h2>
      {loading ? (
        <p>Loading comments...</p>
      ) : (
        comments.map((comment) => (
          <div key={comment.comment_id} className="comment">
            <div className="comment-header">
              <span className="comment-name">{comment.member_name}</span>
              <span className="comment-time">{formatDate(comment.comment_var_at)}</span>
            </div>
            <p className="comment-text">{comment.comment_var_text}</p>
            <div className="comment-footer">
              <button
                className="delete-comment-button"
                onClick={() => handleCommentDelete(comment.comment_id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
      <div className="comment-input">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
        />
        <button onClick={handleCommentSubmit}>Post</button>
      </div>
    </div>
  );

  return (
    <div className="container">
      <h1 className="title">Validation Requirement</h1>
      <div className="box requirements">
        <h2>Requirements</h2>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Requirement Statement</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {requirementsDetails.map((req) => (
              <tr key={req.requirement_id}>
                <td>REQ-{req.requirement_id.toString().padStart(3, "0")}</td>
                <td>{req.requirement_name}</td>
                <td>{req.requirement_type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {renderComments()}

      <div className="box">
        <h2>File Attachment</h2>
        <input type="file" accept=".pdf" onChange={handleFileChange} />
        {attachedFile && <p>Selected File: {attachedFile.name}</p>}
        <button onClick={handleFileUpload} disabled={fileUploading}>
          {fileUploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      <div className="button-container">
        <button className="save-button" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
};

export default ReqValidation;
