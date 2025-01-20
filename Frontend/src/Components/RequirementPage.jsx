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
import close from "../image/close.png";
import verified from "../image/verified.png";
import history from "../image/history.png";
import { jsPDF } from "jspdf"
import "jspdf-autotable";
import clearsearch from '../image/clearsearch.png'


Modal.setAppElement("#root"); // For accessibility

const RequirementPage = () => {
  const [requirementList, setRequirementList] = useState([]);

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
  const [filteredRequirements, setFilteredRequirements] = useState([]);
  const [alertMessage] = useState(""); // เก็บข้อความแจ้งเตือน
  const [setRequirements] = useState([]);


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

  useEffect(() => {
    if (searchQuery) {
      const filtered = requirementList.filter((requirement) =>
        requirement.requirement_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        requirement.requirement_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `REQ-${requirement.requirement_id.toString()}`.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRequirements(filtered);
    } else {
      setFilteredRequirements(requirementList); // Show all if searchQuery is empty
    }
  }, [searchQuery, requirementList]);

  useEffect(() => {
    if (projectId) {
      axios
        .get(`http://localhost:3001/requirements?project_id=${projectId}`)
        .then((res) => {
          setRequirements(res.data); // Update state with fetched requirements
        })
        .catch((err) => {
          console.error("Error fetching requirements:", err);
        });
    }
  }, [projectId, setRequirements]); // Include both dependencies

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
      `REQ-0${req.requirement_id}`,
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

  const handleViewFile = (file) => {
    navigate(`/ViewFile`, { state: { file } });
  };

  const handleVerificationHis = () => {
    navigate(`/VerificationHis`);
  }

  const handleCreateVeri = () => {
    navigate(`/CreateVeri?project_id=${projectId}`);
  }

  const handleVerilist = () => {
    navigate(`/VerificationList?project_id=${projectId}`);
  }


  const handleCreateVar = () => {
    navigate(`/CreateVar?project_id=${projectId}`);
  }

  return (
    <div className="requirement-container">
      <div className="req-top-section">
        <h1 className="requirement-title">Project {projectName || projectId} Requirements</h1>
        <div className="req-action-buttons">

          <button className="create-verification-button" onClick={handleCreateVeri}>
            <img src={history} alt="history" className="history" />Create Verification
          </button>

          <button className="verify-button" onClick={handleVerilist}>
            <img src={history} alt="history" className="history" /> Verification List
          </button>

          <button className="CreateVar-button" onClick={handleCreateVar}>
            <img src={history} alt="history" className="history" /> Create Validation
          </button>

          <button className="verhistory-button" onClick={handleVerificationHis}>
            <img src={history} alt="history" className="history" /> Validation
          </button>

          <button className="review-button" onClick={handleVerificationHis}>
            <img src={checkmark} alt="checkmark" className="checkmark" /> View Verification and Validation
          </button>

          <button className="verhistory-button" onClick={handleVerificationHis}>
            <img src={history} alt="history" className="history" /> Version Control
          </button>

        </div>
      </div>
      {alertMessage && <p className="alert-message">{alertMessage}</p>}
      <div className="req-search">
        <input
          type="text"
          className="req-search-input"
          placeholder="Search Requirement"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <img
            src={clearsearch}
            alt="clearsearch-req"
            className="clearsearch-req"
            onClick={() => setSearchQuery('')}
          />
        )}
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
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Actions</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequirements.map((data, index) => (
                <tr key={data.requirement_id}>
                  {/* แสดง REQ-ID ที่มีเลข 3 หลัก */}
                  <td
                    onClick={() =>
                      navigate(`/ViewEditReq?requirement_id=${data.requirement_id}`, {
                        state: { requirement: data },
                      })
                    }
                    style={{ cursor: "pointer", userSelect: "none" }}
                  >
                    REQ-{(index + 1).toString().padStart(3, "0")} {/* เพิ่มเลขให้เป็น 3 หลัก */}
                  </td>
                  <td
                    onClick={() =>
                      navigate(`/ViewEditReq?requirement_id=${data.requirement_id}`, {
                        state: { requirement: data },
                      })
                    }
                    style={{ cursor: "pointer", userSelect: "none" }}
                  >
                    {data.requirement_name}
                  </td>
                  <td
                    onClick={() =>
                      navigate(`/ViewEditReq?requirement_id=${data.requirement_id}`, {
                        state: { requirement: data },
                      })
                    }
                    style={{ cursor: "pointer", userSelect: "none" }}
                  >
                    {data.requirement_type}
                  </td>

                  {/* Actions */}
                  <td>
                    <button
                      onClick={() =>
                        navigate(`/ViewEditReq?requirement_id=${data.requirement_id}`, {
                          state: { requirement: data },
                        })
                      }
                      className="action-button view-req colored-view-button"
                    >
                      <FontAwesomeIcon icon={faEye} className="action-icon" />
                    </button>

                    <button
                      onClick={() =>
                        navigate(
                          `/UpdateRequirement?project_id=${projectId}&requirement_id=${data.requirement_id}`
                        )
                      }
                      className="action-button edit-req colored-edit-button"
                      disabled={data.requirement_status === "VERIFIED"} // Disable Edit button if VERIFIED
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
                    <button
                      className={`status-button 
            ${data.requirement_status === 'VERIFIED' ? 'status-verified' : ''} 
            ${data.requirement_status === 'WORKING' ? 'status-working' : ''} 
            ${data.requirement_status === 'WAITING FOR VERIFICATION' ? 'status-not-complete' : ''}`}
                    >
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
                  <th>ID</th>
                  <th>Name</th>
                  <th>Requirement ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.filereq_id}>
                    <td>{file.filereq_id}</td> {/* แสดง `filereq_id` */}
                    <td>{file.title || file.filereq_name}</td> {/* ใช้ `title` หรือ `filereq_name` */}
                    <td>
                      {file.requirement_id ? `REQ-${file.requirement_id.toString().padStart(3, "0")}` : "N/A"}
                      {/* แสดง `requirement_id` และทำให้เป็น 3 หลัก */}
                    </td>
                    <td className="file-actions">
                      <button
                        className="view-requirement-button"
                        onClick={() => handleViewFile(file)}
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
                        <td>REQ-0{req.requirement_id}</td>
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
