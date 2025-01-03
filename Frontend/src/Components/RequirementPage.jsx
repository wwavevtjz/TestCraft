import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash, faFileUpload, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FileAddOutlined } from '@ant-design/icons';
import Modal from 'react-modal'; // Importing Modal
import UploadFile from './Uploadfile'; // Importing UploadFile component
import "./CSS/RequirementPage.css";
import checkmark from '../image/check_mark.png';
import checklist from '../image/attendance_list.png';

Modal.setAppElement('#root'); // For accessibility

const RequirementPage = () => {
  const [requirementList, setRequirementList] = useState([]);
  const [selectedRequirements, setSelectedRequirements] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileList, setFileList] = useState([]); // State for uploaded files
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get("project_id");

  useEffect(() => {
    if (projectId) {
      setLoading(true);

      // Fetch project name
      axios
        .get(`http://localhost:3001/project/${projectId}`)
        .then((res) => {
          setProjectName(res.data.project_name);
        })
        .catch((err) => {
          console.error("Error fetching project name:", err);
          setError("Failed to load project name. Please try again.");
        });

      // Fetch requirements from the project
      axios
        .get(`http://localhost:3001/project/${projectId}/requirement`)
        .then((res) => {
          const updatedRequirements = res.data.map((requirement) => ({
            ...requirement,
            status: "WORKING",
          }));
          setRequirementList(updatedRequirements);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching requirements:", err);
          setError("Failed to load requirements. Please try again.");
          setLoading(false);
        });

      // Fetch uploaded files
      axios
        .get(`http://localhost:3001/project/${projectId}/files`)
        .then((res) => {
          setFileList(res.data); // Update file list
        })
        .catch((err) => {
          console.error("Error fetching uploaded files:", err);
        });
    }
  }, [projectId, isModalOpen]); // Refetch files when the modal closes

  const handleSelectRequirement = (id) => {
    const selectedRequirement = requirementList.find(req => req.requirement_id === id);
    setSelectedRequirements((prev) =>
      prev.some((req) => req.requirement_id === id)
        ? prev.filter((req) => req.requirement_id !== id)
        : [...prev, selectedRequirement]
    );
  };
  
  const handleDeleteRequirement = (requirementId) => {
    if (window.confirm("Are you sure you want to delete this requirement?")) {
      axios
        .delete(`http://localhost:3001/requirement/${requirementId}`)
        .then((response) => {
          setRequirementList((prev) =>
            prev.filter((req) => req.requirement_id !== requirementId)
          );
        })
        .catch((err) => {
          console.log("Error deleting requirement:", err);
        });
    }
  };

  const handleDeleteFile = (fileId) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      axios
        .delete(`http://localhost:3001/files/${fileId}`)
        .then(() => {
          setFileList((prev) => prev.filter((file) => file.file_id !== fileId));
        })
        .catch((err) => {
          console.error("Error deleting file:", err);
        });
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="requirement-container">
      <div className="top-section">
        <h1 className="requirement-title">Project {projectName || projectId} Requirements</h1>
        <div className="action-buttons">
          <button className="review-button" onClick={() => navigate("/ReviewReqVeri")}>
            <img src={checkmark} alt="checkmark" className="checkmark" />Review Verified
          </button>
          <button
            className="verify-button"
            onClick={() =>
              navigate(`/ReqVerification?project_id=${projectId}`, { state: { selectedRequirements } })
            }
          >
            <img src={checklist} alt="checklist" className="checklist" /> Verification
          </button>
        </div>
      </div>

      <div className="req-search">
        <input
          type="text"
          className="req-search-input"
          placeholder="Search Requirement"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <FontAwesomeIcon icon={faMagnifyingGlass} className="search-icon-req" />
        <button
          onClick={() => navigate(`/CreateRequirement?project_id=${projectId}`)}
          className="add-requirement-button"
        >
          <FileAddOutlined className="add-req" /> Add Requirements
        </button>
      </div>

      <div className="content-container">
        {loading ? (
          <p>Loading requirements...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : (
          <table className="requirement-table">
            <thead>
              <tr>
                <th>Select</th>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Description</th>
                <th>Actions</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requirementList.map((data) => (
                <tr key={data.requirement_id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRequirements.some((req) => req.requirement_id === data.requirement_id)}
                      onChange={() => handleSelectRequirement(data.requirement_id)}
                    />
                  </td>
                  <td>REQ-00{data.requirement_id}</td>
                  <td>{data.requirement_name}</td>
                  <td>{data.requirement_type}</td>
                  <td>{data.requirement_description}</td>
                  <td>
                    <button
                      onClick={() => navigate(`/UpdateRequirement?project_id=${projectId}&requirement_id=${data.requirement_id}`)}
                      className="action-button edit-req"
                    >
                      <FontAwesomeIcon icon={faPen} />
                    </button>
                    <button
                      onClick={() => handleDeleteRequirement(data.requirement_id)}
                      className="action-button delete-req"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                  <td>{data.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="file-upload-section">
        <h3>Files</h3>
        <div className="file-upload-container">
          <button onClick={handleOpenModal} className="upload-button">
            <FontAwesomeIcon icon={faFileUpload} /> Add File
          </button>
        </div>
        <div className="uploaded-files">
          {fileList.length > 0 ? (
            <ul className="file-list">
              {fileList.map((file) => (
                <li key={file.file_id} className="file-item">
                  <a href={`http://localhost:3001/files/${file.file_id}/download`} target="_blank" rel="noopener noreferrer">
                    {file.title}
                  </a>
                  <button onClick={() => handleDeleteFile(file.file_id)} className="delete-file-button">
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No files uploaded yet.</p>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={handleCloseModal}
        contentLabel="Upload File Modal"
        className="upload-file-modal"
        overlayClassName="modal-overlay"
      >
        <UploadFile onClose={handleCloseModal} />
      </Modal>
    </div>
  );
};

export default RequirementPage;
