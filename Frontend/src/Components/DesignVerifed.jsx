import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Comment from "./Comment";
import "./CSS/DesignVerifed.css";

const DesignVerifed = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get("project_id");
  const designId = queryParams.get("design_id");
  const { selectedDesign = [] } = location.state || {}; // ค่า default เป็น []
  const [designcriList, setDesigncriList] = useState([]);
  const [designDetails, setDesignDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkboxState, setCheckboxState] = useState({});

  useEffect(() => {
    if (!projectId || !designId) {
        console.error("Project ID or Verification ID is missing.");
        navigate("/VeriDesign");
        return;
    }

    const combinedDesignIds = [...selectedDesign, designId].filter(Boolean);
    if (combinedDesignIds.length > 0) {
        fetchDesignDetails(combinedDesignIds); // ส่งเฉพาะ design_id ที่เลือกมา
    }

    fetchCriteria();
}, [projectId, designId, selectedDesign, navigate]);

  const fetchCriteria = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3001/designcriteria");
      const initialCheckboxState = response.data.reduce((acc, criteria) => {
        acc[criteria.design_cri_id] = false;
        return acc;
      }, {});
      setDesigncriList(response.data);

      const storedUsername = localStorage.getItem("username");
      if (storedUsername) {
        const storedCheckboxState = localStorage.getItem(
          `checkboxState_${storedUsername}_${projectId}_${designId}`
        );
        setCheckboxState(
          storedCheckboxState ? JSON.parse(storedCheckboxState) : initialCheckboxState
        );
      }
    } catch (error) {
      console.error("Error fetching criteria:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDesignDetails = async (designIds) => {
    if (!designIds.length) {
        console.error("No Design IDs provided.");
        return;
    }

    try {
        console.log("Fetching design details for design_id:", designIds);
        const response = await axios.get("http://localhost:3001/verifydesign", {
            params: { design_id: designIds.join(",") },
        });
        setDesignDetails(response.data);
    } catch (error) {
        console.error("Error fetching design details:", error);
    }
};


  const handleCheckboxChange = (id) => {
    const updatedState = {
      ...checkboxState,
      [id]: !checkboxState[id],
    };
    setCheckboxState(updatedState);

    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      localStorage.setItem(
        `checkboxState_${storedUsername}_${projectId}_${designId}`,
        JSON.stringify(updatedState)
      );
    }
  };

  const handleSave = async () => {
    // ตรวจสอบว่าผู้ใช้ทำเครื่องหมายครบทุกช่องหรือไม่
    const allChecked = Object.values(checkboxState).every((value) => value);
  
    if (!allChecked) {
      toast.success("Criteria Checklist Saved", {
        position: "top-right",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        onClose: () => navigate(`/VeriDesign?project_id=${projectId}`),
      });
      return;
    }
  
    try {
      // ดึงชื่อผู้ใช้จาก localStorage
      const storedUsername = localStorage.getItem("username");
      if (!storedUsername) {
        alert("Please log in first.");
        return;
      }
  
      // แทนที่ 'your_veridesign_id_here' ด้วย ID ที่แท้จริง
      const veriDesignId = 123; // ใช้ veridesign_id ที่แท้จริง (เช่นจากข้อมูลที่คุณมี)
  
      const updatedVerificationBy = ["Pasin Thonguran: true", "Phumipat Tomyim: false"]; // ตัวอย่างข้อมูลที่มีอยู่
  
  
      // ตรวจสอบว่าทุกคนตรวจสอบครบหรือไม่
      const allVerified = updatedVerificationBy.every((entry) => {
        const [, status] = entry.split(":").map((item) => item.trim());
        return status === "true";
      });
  
      if (allVerified) {
        // ดึงรายการ design_id ทั้งหมดที่เกี่ยวข้องกับโครงการ
        const designIds = designDetails.map((req) => req.design_id);
  
        // อัปเดตสถานะของการออกแบบเป็น "VERIFIED"
        await axios.put("http://localhost:3001/update-design-status-verified", {
          design_ids: designIds,
          design_status: "VERIFIED",
        });

        // บันทึกประวัติการเปลี่ยนแปลงของแต่ละการออกแบบ
        for (const designId of designIds) {
          const historyDesignData = {
            design_id: designId,
            design_status: "VERIFIED",
          };
  
          await axios.post("http://localhost:3001/addHistoryDesign", historyDesignData);
        }
  
        // แจ้งเตือนและนำทางกลับไปยัง Dashboard
        toast.success("All criteria verified! Status updated to VERIFIED.", {
          position: "top-right",
          autoClose: 1500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          onClose: () => navigate(`/Dashboard?project_id=${projectId}`),
        });
      } else {
        // แจ้งเตือนว่าผู้ใช้บางคนยังไม่ได้ตรวจสอบ
        toast.warning("Not all users have verified. Please wait for everyone to verify.", {
          position: "top-right",
          autoClose: 1800,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          onClose: () => navigate(`/VeriDesign?project_id=${projectId}`),
        });
      }
    } catch (error) {
      console.error("Error updating verification status:", error);
      toast.error("Failed to update verification status. Please try again.", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  return (
    <div className="container">
      <h1 className="title">Verification Requirement</h1>

      <div className="flex-container">
        <div className="box">
          <h2>Checklist</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ul className="checklist">
              {designcriList.map((criteria) => (
                <li key={criteria.design_cri_id}>
                  <label>
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={checkboxState[criteria.design_cri_id] || false}
                      onChange={() => handleCheckboxChange(criteria.design_cri_id)}
                    />
                    {criteria.design_cri_name}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="box">
          <Comment designId={designId} />
        </div>
      </div>

      <div className="box requirements">
        <table className="table">
          <thead>
            <tr><th>ID</th><th>Design Name</th><th>Type</th></tr>
          </thead>
          <tbody>
            {designDetails.length > 0 ? (
              designDetails.map((design) => (
                <tr key={design.design_id}>
                  <td>SD-0{design.design_id}</td>
                  <td>{design.diagram_name || "N/A"}</td>
                  <td>{design.design_type || "N/A"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3">No design details found</td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

      <div className="button-container">
        <button className="save-button" onClick={handleSave}>Save</button>
      </div>
    </div>
  );
};

export default DesignVerifed;
