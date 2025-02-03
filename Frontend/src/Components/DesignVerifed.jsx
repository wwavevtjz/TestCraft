import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Comment from "./Comment";
import "./CSS/DesignVerifed.css";
import { Data } from "emoji-mart";

const DesignVerifed = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get("project_id");
  const veridesignId = queryParams.get("veridesign_id");
  const { selectedDesign = [] } = location.state || {};
  const [designcriList, setDesigncriList] = useState([]);
  const [designDetails, setDesignDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkboxState, setCheckboxState] = useState({});
  const [veridesignBy, setVeridesignBy] = useState({});
  const storedUsername = localStorage.getItem("username");
  const designId = queryParams.get("design_id");

  useEffect(() => {
    if (!projectId || !veridesignId) {
      console.error("Project ID or Design ID is missing.");
      navigate("/VeriDesign");
      return;
    }

    fetchCriteria();
    fetchDesignDetails(selectedDesign);
    fetchVeridesignBy();
  }, [projectId, veridesignId, selectedDesign, navigate]);

  // ดึงข้อมูล veridesign_by
  const fetchVeridesignBy = async () => {
    try {
      const response = await axios.get("http://localhost:3001/designveri", {
        params: { project_id: projectId, veridesign_id: veridesignId, design_id: designId },
      });
      const veridesign = response.data.find(
        (item) => item.id === veridesignId
      );
      setVeridesignBy(veridesign?.veridesign_by || {});
    } catch (error) {
      console.error("Error fetching veridesign_by:", error);
    }
  };


  const fetchCriteria = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3001/designcriteria");
      const initialCheckboxState = response.data.reduce((acc, criteria) => {
        acc[criteria.design_cri_id] = false;
        return acc;
      }, {});
      setDesigncriList(response.data);

      if (storedUsername) {
        const storedCheckboxState = localStorage.getItem(
          `checkboxState_${storedUsername}_${projectId}_${veridesignId}`
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

  const fetchDesignDetails = async () => {
    try {
      const response = await axios.get("http://localhost:3001/verifydesign", {
        params: { design_id: designId },
      });
      setDesignDetails(response.data);
    } catch (error) {
      console.error("Error fetching design details:", error);
    }
  };

  const handleCheckboxChange = (id) => {
    setCheckboxState((prevState) => {
      const updatedState = { ...prevState, [id]: !prevState[id] };

      localStorage.setItem(
        `checkboxState_${storedUsername}_${projectId}_${veridesignId}`,
        JSON.stringify(updatedState)
      );

      return updatedState;
    });
  };

  const handleSave = async () => {

    console.log("design_id", designId);
    
    if (!storedUsername) {
      toast.warning("ข้อมูล reviewer ขาดหาย กรุณารีเฟรชหน้า");
      return;
    }

    // เช็คว่า checkbox ทั้งหมดถูกเลือกหรือไม่
    const allChecked = designcriList.every((criteria) => checkboxState[criteria.design_cri_id]);

    if (!allChecked) {
      toast.warning("กรุณาเลือกทุกข้อก่อนกด Save");
      return;
    }

    // อัปเดต veridesign_by โดยไม่ลบผู้ใช้คนอื่น
    const updatedVeridesignBy = { ...veridesignBy, [storedUsername]: true };

    try {
      const response = await axios.put("http://localhost:3001/update-veridesign-by", {
        veridesign_id: veridesignId,
        veridesign_by: updatedVeridesignBy, // ส่งข้อมูลที่อัปเดต
      });

      if (response.data.message === "ไม่พบข้อมูล veridesign นี้ในฐานข้อมูล") {
        toast.error("ไม่พบข้อมูล veridesign ID กรุณาตรวจสอบใหม่");
        return;
      }

      // ดึงข้อมูล veridesign_by ใหม่หลังจากอัปเดต
      const updatedResponse = await axios.get("http://localhost:3001/designveri", {
        params: { project_id: projectId, veridesign_id: veridesignId },
      });

      console.log("API Response Data:", updatedResponse.data);
      const data = updatedResponse.data[0];

const allReviewed = data.veridesign_by &&
  Object.values(data.veridesign_by).every((status) => status === true);
  console.log("DATA",data);
  console.log("ALLREEVIEWED",allReviewed);
  

      if (allReviewed) {
        const designIdsArray = designId.split(",").map((id) => id.trim());
        console.log("designIdsArray", designIdsArray);
        
        if (designIdsArray.length === 0) {
          toast.error("ไม่พบข้อมูล design ID กรุณาตรวจสอบใหม่");
          return;
        }

        // ส่ง design_id ไปเพื่ออัปเดตสถานะ
        const updateStatusResponse = await axios.put(
          `http://localhost:3001/update-design-status-verified`,
          { design_ids: designIdsArray, design_status: "VERIFIED" }
        );


        if (updateStatusResponse.data.message === "Design status updated to VERIFIED successfully.") {
          toast.success("อัปเดตสถานะเป็น VERIFIED สำเร็จ", {
            autoClose: 1500,
            onClose: () => navigate(`/Dashboard?project_id=${projectId}`),
          });
        } else {
          toast.error("ไม่สามารถอัปเดตสถานะ design ได้");
        }
      } else {
        toast.warning("ยังมี reviewer ที่ยังไม่ได้ทำการตรวจสอบ");
      }
    } catch (error) {
      console.error("Error updating verification status:", error);
      toast.error("ไม่สามารถอัปเดตสถานะได้ กรุณาลองใหม่");
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
          <Comment designId={veridesignId} />
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
        <button onClick={handleSave} className="save-button">Save</button>
      </div>
    </div>
  );
};

export default DesignVerifed;