import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash, faFileUpload, faMagnifyingGlass, faDownload, faEye } from "@fortawesome/free-solid-svg-icons";
import { FileAddOutlined } from "@ant-design/icons";
import Modal from "react-modal";
import UploadFile from "./Uploadfile";
import "./CSS/RequirementPage.css";
import checkmark from "../image/check_mark.png";
import checklist from "../image/attendance_list.png";
import close from "../image/close.png";
import verified from "../image/verified.png";
import { jsPDF } from "jspdf"
import "jspdf-autotable";


Modal.setAppElement("#root"); // For accessibility

const RequirementPage = () => {
  const [requirementList, setRequirementList] = useState([]);
  const [selectedRequirements, setSelectedRequirements] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [files, setFiles] = useState([]); // State for files
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get("project_id");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedRequirementId, setSelectedRequirementId] = useState(null);


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

      // Fetch files for the project
      axios
        .get(`http://localhost:3001/files?project_id=${projectId}`)
        .then((res) => {
          setFiles(res.data); // Store fetched files data
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching files:", err);
          setError("Failed to load files. Please try again.");
          setLoading(false);
        });
    }
  }, [projectId]);


  const handleSelectRequirement = (id) => {
    const selectedRequirement = requirementList.find((req) => req.requirement_id === id);
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

  const handleOpenReviewModal = () => {
    setIsReviewModalOpen(true);

    // กำหนด requirement_status ให้เป็น "VERIFIED" สำหรับแค่การแสดงใน Modal เท่านั้น
    const verifiedRequirements = requirementList.filter((req) => req.requirement_status === "WORKING");

    // ส่งข้อมูล requirements ที่มีสถานะ "WORKING" มาแสดงใน Modal
    setSelectedRequirements(verifiedRequirements);
  };



  const handleExportPDF = () => {
    const doc = new jsPDF();

    // สร้างหัวข้อใน PDF
    doc.setFontSize(18);
    doc.text("Verified Requirements", 14, 20);

    // สร้างตารางข้อมูล
    const verifiedRequirements = requirementList.filter(
      (req) => req.requirement_status === "VERIFIED"
    );

    const tableData = verifiedRequirements.map((req) => [
      `REQ-00${req.requirement_id}`,
      req.requirement_name,
      req.requirement_description,
      req.requirement_type,
      req.requirement_status,
    ]);

    // ใส่ข้อมูลลงในตาราง PDF
    doc.autoTable({
      head: [["REQ-ID", "Name", "Description", "Type", "Status"]],
      body: tableData,
      startY: 30, // ตำแหน่งเริ่มต้นของตาราง
    });

    // ดาวน์โหลด PDF
    doc.save(`${projectName}_verified_requirements.pdf`);
  };

  const handleCloseReviewModal = () => {
    setIsReviewModalOpen(false);
  };


  const handleOpenModal = () => {
    setIsModalOpen(true); // Open the modal
  };

  const handleCloseModal = () => {
    setIsModalOpen(false); // Close the modal
  };

  const handleDeleteFile = (fileId) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      axios
        .delete(`http://localhost:3001/files/${fileId}`)
        .then((response) => {
          console.log("File deleted:", response.data);
          setFiles((prevFiles) =>
            prevFiles.filter((file) => file.filereq_id !== fileId)
          );
        })
        .catch((err) => {
          console.error("Error deleting file:", err);
          setError("Failed to delete file. Please try again.");
        });
    }
  };


  return (
    <div className="requirement-container">
      <div className="top-section">
        <h1 className="requirement-title">Project {projectName || projectId} Requirements</h1>
        <div className="action-buttons">
          <button className="review-button" onClick={handleOpenReviewModal}>
            <img src={checkmark} alt="checkmark" className="checkmark" /> Review Verified
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
                      checked={selectedRequirements.some(
                        (req) => req.requirement_id === data.requirement_id
                      )}
                      onChange={() => handleSelectRequirement(data.requirement_id)}
                    />
                  </td>
                  <td>REQ-00{data.requirement_id}</td>
                  <td>{data.requirement_name}</td>
                  <td>{data.requirement_type}</td>
                  <td>{data.requirement_description}</td>
                  <td>
                    <button
                      onClick={() =>
                        navigate(
                          `/UpdateRequirement?project_id=${projectId}&requirement_id=${data.requirement_id}`
                        )
                      }
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

                  <td>
                    <button className={`status-button 
                      ${data.requirement_status === 'VERIFIED' ? 'status-verified' : ''}
                      ${data.requirement_status === 'WORKING' ? 'status-working' : ''}
                      ${data.requirement_status === 'VERIFY NOT COMPLETE' ? 'status-not-complete' : ''}
                    `}>
                      {data.requirement_status}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* File Upload Section */}
      <div className="file-upload-section">
        <div className="upload-section">
          <h3>Uploaded Files</h3>
          <button onClick={handleOpenModal} className="upload-req">
            <FontAwesomeIcon icon={faFileUpload} /> Add File
          </button>
        </div>

        <div className="file-upload-container">
          {loading ? (
            <p>Loading files...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : (
            <table className="table-file">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.filereq_id}>
                    <td>{file.title || file.filereq_name}</td>
                    <td className="file-actions">
                      <button
                        className="view-requirement-button"

                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>

                      <button
                        className="download-file-button"
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = `http://localhost:3001/files/${file.filereq_id}`;
                          link.download = file.filereq_name.endsWith(".pdf")
                            ? file.filereq_name
                            : `${file.filereq_name}.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        <FontAwesomeIcon icon={faDownload} />
                      </button>

                      <button
                        className="delete-file-button"
                        onClick={() => handleDeleteFile(file.filereq_id)}
                      >
                        <FontAwesomeIcon icon={faTrash} className="delete-file" />
                      </button>

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          )}
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
        <UploadFile
          onClose={handleCloseModal}
          onUploadSuccess={(newFile) => {
            if (!newFile.title) {
              newFile.title = newFile.filereq_name; // Ensure title fallback
            }
            setFiles((prevFiles) => [newFile, ...prevFiles]); // Add new file to the top of the list
          }}
        />
      </Modal>

      <Modal
        isOpen={isReviewModalOpen}
        onRequestClose={handleCloseReviewModal}
        contentLabel="Review Verified PDF"
        className="review-modal"
        overlayClassName="modal-overlay"
      >
        <div className="modal-content-reviewreq">
          <div className="verified-requirements-section">
            <h3 className="ver-topic">Verified Requirements</h3>
            <img onClick={handleCloseReviewModal} src={close} alt="close-reviewreq" className="close-reviewreq" />
            {requirementList.length > 0 ? (
              <table className="verified-requirements-table">
                <thead>
                  <tr>
                    <th>REQ-ID</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requirementList
                    .filter((req) => req.requirement_status === "VERIFIED")
                    .map((req) => (
                      <tr key={req.requirement_id}>
                        <td>REQ-00{req.requirement_id}</td>
                        <td>{req.requirement_name}</td>
                        <td>{req.requirement_description}</td>
                        <td>{req.requirement_type}</td>
                        <td>{req.requirement_status}<img src={verified} alt="verified" className="verified" /></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <p>No verified requirements yet.</p>
            )}
            <button className="ExportPDF" onClick={handleExportPDF}>Export PDF</button>
          </div>
        </div>
      </Modal>







    </div>
  );
};

export default RequirementPage;
