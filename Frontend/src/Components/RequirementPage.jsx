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
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal
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
    }
  }, [projectId]);

  const handleSelectRequirement = (id) => {
    const selectedRequirement = requirementList.find(req => req.requirement_id === id);
    setSelectedRequirements((prev) =>
      prev.some((req) => req.requirement_id === id)
        ? prev.filter((req) => req.requirement_id !== id)
        : [...prev, selectedRequirement]
    );
  };
  
  const handleDelete = (requirementId) => {
    if (window.confirm("Are you sure you want to delete this requirement?")) {
      axios
        .delete(`http://localhost:3001/requirement/${requirementId}`)
        .then((response) => {
          console.log("Requirement deleted:", response.data);
          setRequirementList((prev) =>
            prev.filter((req) => req.requirement_id !== requirementId)
          );
        })
        .catch((err) => {
          console.log("Error deleting requirement:", err);
        });
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true); // Open the modal
  };

  const handleCloseModal = () => {
    setIsModalOpen(false); // Close the modal
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
                      className="action-button edit-req colored-edit-button"
                    >
                      <FontAwesomeIcon icon={faPen} className="action-icon" />
                    </button>

                    <button
                      onClick={() => handleDelete(data.requirement_id)}
                      className="action-button delete-req colored-delete-button"
                    >
                      <FontAwesomeIcon icon={faTrash} className="action-icon" />
                    </button>
                  </td>

                  <td>{data.requirement_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* File Upload Section */}
      <div className="file-upload-section">
        <h3>File</h3>
        <div className="file-upload-container">
          <button onClick={handleOpenModal} className="upload-button">
            <FontAwesomeIcon icon={faFileUpload} /> Add File
          </button>
        </div>
      </div>

      {/* Modal for UploadFile */}
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
