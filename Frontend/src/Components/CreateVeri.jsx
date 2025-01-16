import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import "./CSS/CreateVeri.css";

const CreateVeri = () => {
  const [workingRequirements, setWorkingRequirements] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedRequirements, setSelectedRequirements] = useState([]);
  const [selectedReviewers, setSelectedReviewers] = useState({});
  const [loading, setLoading] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requirementsError, setRequirementsError] = useState(null);
  const [membersError, setMembersError] = useState(null);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get("project_id");
  const navigate = useNavigate();

  // Fetch working requirements
  useEffect(() => {
    if (projectId) {
      setLoading(true);
      axios
        .get(`http://localhost:3001/project/${projectId}/requirement`)
        .then((res) => {
          const working = res.data.filter(
            (requirement) => requirement.requirement_status === "WORKING"
          );
          setWorkingRequirements(working);
          setRequirementsError(null);
        })
        .catch(() => {
          setRequirementsError("Failed to load requirements. Please try again.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [projectId]);

  // Fetch project members
  useEffect(() => {
    if (projectId) {
      setIsLoadingMembers(true);
      axios
        .get(`http://localhost:3001/projectname?project_id=${projectId}`)
        .then((res) => {
          if (Array.isArray(res.data)) {
            setMembers(res.data);
            setMembersError(null);
          } else {
            setMembersError("Invalid project member data.");
          }
        })
        .catch(() => {
          setMembersError("Failed to load project members.");
        })
        .finally(() => {
          setIsLoadingMembers(false);
        });
    }
  }, [projectId]);

  // Generalized handle select for requirements
  const handleSelect = (id, setter) => {
    setter((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  // Handle create verification
const handleCreateVerification = async () => {
  const selectedReviewerNames = Object.keys(selectedReviewers).filter(
    (name) => selectedReviewers[name]
  );

  // ตรวจสอบ Project ID
  if (!projectId) {
    toast.error("Invalid project ID.");
    return;
  }

  // ตรวจสอบว่าเลือก Requirement และ Reviewer หรือไม่
  if (selectedRequirements.length === 0 || selectedReviewerNames.length === 0) {
    toast.warning("Please select at least one requirement and one reviewer.");
    return;
  }

  const user = JSON.parse(localStorage.getItem("user"));
const createBy = user?.username; // ดึง username จาก localStorage

const payload = {
  requirements: [...new Set(selectedRequirements)], // ลบค่าที่ซ้ำใน Array
  reviewers: selectedReviewerNames,
  project_id: projectId,
  create_by: createBy, // เพิ่มข้อมูลผู้ใช้
};

  
  console.log("Payload being sent:", payload);
  

  // ป้องกันการกดซ้ำ
  if (isSubmitting) {
    toast.warning("Submitting in progress. Please wait.");
    return;
  }

  setIsSubmitting(true);

  try {
    // เรียก API สร้าง Verification
    const response = await axios.post("http://localhost:3001/createveri", payload);

    if (response.status === 201) {
      toast.success("Verification created successfully!");

      // อัปเดตสถานะของ Requirements เป็น "WAITING FOR VERIFICATION"
      await Promise.all(
        selectedRequirements.map((requirementId) =>
          axios.put(`http://localhost:3001/update-requirements-status/${requirementId}`, {
            requirement_status: "WAITING FOR VERIFICATION",
          })
        )
      );

      // ดึงรายการ Requirement ใหม่
      const refreshedRequirements = await axios.get(
        `http://localhost:3001/project/${projectId}/requirement`
      );

      // กรอง Requirements ที่อยู่ในสถานะ "WORKING"
      const working = refreshedRequirements.data.filter(
        (requirement) => requirement.requirement_status === "WORKING"
      );
      setWorkingRequirements(working);

      // รีเซ็ตการเลือก Requirement และ Reviewer
      setSelectedRequirements([]);
      setSelectedReviewers({});
    } else {
      toast.error(response.data.message || "Failed to create verification(s).");
    }
  } catch (error) {
    console.error("Error creating verification(s):", error);
    toast.error(error.response?.data?.message || "An error occurred. Please try again.");
  } finally {
    // ปิดสถานะกำลังส่ง
    setIsSubmitting(false);
  }
};


  // Handle checkbox for reviewers
  const handleCheckboxReviewer = (memberName) => {
    setSelectedReviewers((prevState) => ({
      ...prevState,
      [memberName]: !prevState[memberName],
    }));
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(`/Dashboard?project_id=${projectId}`);
  };

  return (
    <div className="create-verification-container">
      <h1>Create Verification</h1>
      <div className="content">
        {/* Left Panel (Requirements Section) */}
        <div className="left-panel">
          <h2>Requirements</h2>
          {loading ? (
            <p>Loading requirements...</p>
          ) : requirementsError ? (
            <p className="error-message">{requirementsError}</p>
          ) : workingRequirements.length === 0 ? (
            <p>No requirements found in 'WORKING' status.</p>
          ) : (
            <table className="requirements-table">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {workingRequirements.map((req) => (
                  <tr key={req.requirement_id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRequirements.includes(req.requirement_id)}
                        onChange={() =>
                          handleSelect(req.requirement_id, setSelectedRequirements)
                        }
                      />
                    </td>
                    <td>REQ-0{req.requirement_id}</td>
                    <td>{req.requirement_name}</td>
                    <td>{req.requirement_type}</td>
                    <td>{req.requirement_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right Panel (Reviewers Section) */}
        <div className="right-panel">
          <h2>Reviewers</h2>
          {isLoadingMembers ? (
            <p>Loading reviewers...</p>
          ) : membersError ? (
            <p className="error-message">{membersError}</p>
          ) : members.length === 0 ? (
            <p>No reviewers found.</p>
          ) : (
            members.map((member, index) => {
              let memberInfo = [];
              try {
                memberInfo = member.project_member
                  ? JSON.parse(member.project_member)
                  : [];
              } catch (e) {
                console.error("Invalid JSON in member data:", e);
                setMembersError("Invalid project member data.");
              }

              return (
                <div key={index}>
                  {memberInfo.map((info, roleIndex) => (
                    <div key={roleIndex}>
                      <input
                        type="checkbox"
                        id={info.name}
                        checked={selectedReviewers[info.name] || false}
                        onChange={() => handleCheckboxReviewer(info.name)}
                      />
                      <label htmlFor={info.name}>
                        <strong>{info.name}</strong>: <span>{info.roles}</span>
                      </label>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          className="btn-create"
          onClick={handleCreateVerification}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create"}
        </button>
        <button className="btn-cancel" onClick={handleCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default CreateVeri;
