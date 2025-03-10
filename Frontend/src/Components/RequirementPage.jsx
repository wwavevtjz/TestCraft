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
import history from "../image/history.png";
import createvervar from "../image/createvervar.png";
import verificationlist from "../image/white_list.png";
import validationlist from "../image/accepted_document.png";
import version_control from "../image/version_control.png";
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
  const [filteredRequirements, setFilteredRequirements] = useState([]);
  const [alertMessage] = useState(""); // เก็บข้อความแจ้งเตือน
  const [statusFilter, setStatusFilter] = useState(""); // State สำหรับการกรองสถานะ
  const [typeFilter, setTypeFilter] = useState(""); // State สำหรับการกรองสถานะ


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
    let filtered = requirementList.filter((requirement) =>
      requirement.requirement_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      requirement.requirement_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `REQ-${requirement.requirement_id.toString()}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // กรองตาม status ที่เลือก
    if (statusFilter) {
      filtered = filtered.filter((requirement) =>
        requirement.requirement_status === statusFilter
      );
    }

    // กรองตาม type ที่เลือก
    if (typeFilter) {
      filtered = filtered.filter((requirement) =>
        requirement.requirement_type === typeFilter
      );
    }

    setFilteredRequirements(filtered);
  }, [searchQuery, requirementList, statusFilter, typeFilter]); // เพิ่ม statusFilter และ typeFilter ใน dependencies

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

  const handleVerivaliView = () => {
    navigate(`/VeriVaView?project_id=${projectId}`);
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

  const handleVarilist = () => {
    navigate(`/ValidationList?project_id=${projectId}`);
  }

  // ตัวอย่างฟังก์ชัน handleVerControl ที่จะนำข้อมูลไปยังหน้า VersionControl
  const handleVerControl = () => {
    navigate(`/VersionControl?project_id=${projectId}`, { state: { requirementList, projectName } });
  }

  const handleBaseline = () => {
    navigate(`/Baseline?project_id=${projectId}`);
  }

  const handleUploadSuccess = (newFile) => {
    setFiles((prevFiles) => [newFile, ...prevFiles]); // Add new file locally

    // Fetch updated files from server after upload
    axios
      .get(`http://localhost:3001/files?project_id=${projectId}`)
      .then((res) => {
        setFiles(res.data); // Update files from server
      })
      .catch((err) => {
        console.error("Error fetching updated files:", err);
      });
  };

  return (
    <div className=" ">
      <div className="requirement-container">
        <div className="requirement-header">
          <h1 className="requirement-title">{projectName || projectId} Requirements</h1>
          <div className="req-action-buttons">
            <button className="create-verification-button" onClick={handleCreateVeri}>
              <img src={createvervar} alt="createver" className="createver" /> Create Verification
            </button>

            <button className="verifylist-button" onClick={handleVerilist}>
              <img src={verificationlist} alt="verificationlist" className="verificationlist" /> Verification List
            </button>

            <button className="CreateVar-button" onClick={handleCreateVar}>
              <img src={createvervar} alt="createvervar" className="createvervar" /> Create Validation
            </button>

            <button className="validation-button" onClick={handleVarilist}>
              <img src={validationlist} alt="validationlist" className="validationlist" /> Validation List
            </button>

            <button className="viewvervar-button" onClick={handleVerivaliView}>
              <img src={checkmark} alt="checkmark" className="checkmark" /> View Verification and Validation
            </button>

            <button className="versioncontrol-button" onClick={handleVerControl}>
              <img src={version_control} alt="version_control" className="version_control" /> Version Control
            </button>

            <button className="baseline-button" onClick={handleBaseline}>
              <img src={history} alt="history" className="history" /> Baseline
            </button>
          </div>
        </div>
      </div>



      {alertMessage && <p className="alert-message">{alertMessage}</p>}
      <div className="req-search">
        <div className="search-container">
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
          {/* <FontAwesomeIcon icon={faMagnifyingGlass} className="search-icon-req" /> */}
        </div>
        <div className="requirement_filterstatus">
          <label className="requirement_filterstatus-label">
            Filter by Status:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="requirement_filterstatus-select"
          >
            <option value="">All</option>
            <option value="WORKING">Working</option>
            <option value="VERIFIED">Verified</option>
            <option value="VALIDATED">Validated</option>
            <option value="WAITING FOR VERIFICATION">Waiting for Verification</option>
            <option value="WAITING FOR VALIDATION">Waiting for Validation</option>
            <option value="BASELINE">Baseline</option>
          </select>
        </div>

        <div className="requirement_filtertype">
          <label className="requirement_filtertype-label">
            Filter by Type:
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)} // setTypeFilter สำหรับ type
            className="requirement_filtertype-select"
          >
            <option value="">All</option>
            <option value="Functional">Functionality</option>
            <option value="User interface">User interface</option>
            <option value="External interfaces">External interfaces</option>
            <option value="Reliability">Reliability</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Portability">Portability</option>
            <option value="Limitations Design and construction">Limitations Design and construction</option>
            <option value="Interoperability">Interoperability</option>
            <option value="Reusability">Reusability</option>
            <option value="Legal and regulative">Legal and regulative</option>
          </select>
        </div>

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
                    REQ-00{data.requirement_id} {/* เพิ่มเลขให้เป็น 3 หลัก */}
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
            ${data.requirement_status === 'VALIDATED' ? 'status-validated' : ''} 
            ${data.requirement_status === 'WORKING' ? 'status-working' : ''} 
            ${data.requirement_status === 'WAITING FOR VERIFICATION' ? 'status-waiting-ver' : ''}
            ${data.requirement_status === 'WAITING FOR VALIDATION' ? 'status-val-inprogress' : ''}
            ${data.requirement_status === 'BASELINE' ? 'status-baseline' : ''}
            `}
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
                  <th>File ID</th>
                  <th>File Name</th>
                  <th>Requirement ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.filereq_id}>
                    <td>{file.filereq_id}</td>
                    <td>{file.filereq_name}</td>
                    <td>
                      {file.requirement_ids && file.requirement_ids.length > 0
                        ? file.requirement_ids.map(id => `REQ-${id}`).join(", ")
                        : "-"}
                    </td>
                    <td className="file-actions">
                      <button
                        className="view-requirement-button"
                        onClick={() => {
                          if (file?.filereq_id) {
                            navigate(`/ViewFile?filereq_id=${file.filereq_id}`, { state: { file } });
                          } else {
                            console.error("Invalid filereq_id:", file);
                          }
                        }}
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>



                      <button
                        className="download-file-button"
                        onClick={async () => {
                          try {
                            const fileId = file?.filereq_id;
                            if (!fileId) {
                              alert("Invalid file ID");
                              return;
                            }

                            const response = await fetch(`http://localhost:3001/files/${fileId}`);

                            if (!response.ok) {
                              throw new Error(`Failed to fetch file: ${response.statusText}`);
                            }

                            const blob = await response.blob();
                            const fileURL = window.URL.createObjectURL(blob);
                            const link = document.createElement("a");

                            link.href = fileURL;
                            link.download = file.filereq_name.endsWith(".pdf") ? file.filereq_name : `${file.filereq_name}.pdf`;

                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);

                            window.URL.revokeObjectURL(fileURL);
                          } catch (error) {
                            console.error("Download error:", error);
                            alert("Failed to download file. Please try again.");
                          }
                        }}
                      >
                        <FontAwesomeIcon icon={faDownload} />
                      </button>



                      <button className="delete-file-button" onClick={() => handleDeleteFile(file.filereq_id)}>
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
          onUploadSuccess={handleUploadSuccess} // Pass the success handler to the modal
          projectId={projectId}
        />
      </Modal>

    </div>
  );
};

export default RequirementPage;
