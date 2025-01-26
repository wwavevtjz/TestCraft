import React, { useEffect, useState } from "react";
import "./CSS/VeriVaView.css";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const VeriVaView = () => {
  const [data, setData] = useState([]);
  const [statusFilter, setStatusFilter] = useState(""); // สำหรับตัวกรองสถานะ
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const projectName = "ProjectName"; // ชื่อโปรเจกต์สำหรับชื่อไฟล์ PDF

  useEffect(() => {
    setLoading(true);
    setError("");

    // ดึงข้อมูลจาก API
    fetch("http://localhost:3001/api/requirements")
      .then((response) => response.json())
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        setError("Error fetching data. Please try again later.");
        setLoading(false);
      });
  }, []);

  // กรองข้อมูลตามสถานะ
  const filteredData = statusFilter
    ? data.filter((row) => row.requirement_status === statusFilter)
    : data;

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // สร้างหัวข้อใน PDF
    doc.setFontSize(18);
    doc.text("Verified & Validated Requirements", 14, 20);

    // เลือกข้อมูลที่ต้องการ export ตามสถานะที่เลือกใน filter
    const exportData = statusFilter
      ? data.filter((req) => req.requirement_status === statusFilter)
      : data.filter(
          (req) => req.requirement_status === "VERIFIED" || req.requirement_status === "VALIDATED"
        );

    const tableData = exportData.map((req) => [
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
    doc.save(`${projectName}_requirements.pdf`);
  };

  return (
    <div className="veriVaView">
      <h1 className="veriVaView__title">
        Verification & Validation View
      </h1>

      {/* Filter */}
      <div className="veriVaView__filter">
        <label className="veriVaView__filter-label">
          Filter by Status:
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="veriVaView__filter-select"
        >
          <option value="">All</option>
          <option value="VERIFIED">Verified</option>
          <option value="VALIDATED">Validated</option>
        </select>
        
        {/* Export PDF Button */}
        <button className="veriVaView__export-button" onClick={handleExportPDF}>
        Export PDF
      </button>
      </div>
      
      {/* Export PDF Button */}


      {/* Loading and Error Messages */}
      {loading && <p>Loading...</p>}
      {error && <p>{error}</p>}

      {/* Data Table */}
      <table className="veriVaView__table table-auto w-full border-collapse border border-gray-300">
        <thead>
          <tr className="veriVaView__table-header bg-gray-200">
            <th className="veriVaView__table-cell border border-gray-300 px-4 py-2">
              Requirement ID
            </th>
            <th className="veriVaView__table-cell border border-gray-300 px-4 py-2">
              Requirement Name
            </th>
            <th className="veriVaView__table-cell border border-gray-300 px-4 py-2">
              Type
            </th>
            <th className="veriVaView__table-cell border border-gray-300 px-4 py-2">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredData.length > 0 ? (
            filteredData.map((row) => (
              <tr key={row.requirement_id} className="veriVaView__table-row text-center">
                <td className="veriVaView__table-cell border border-gray-300 px-4 py-2">
                REQ-{row.requirement_id}
                </td>
                <td className="veriVaView__table-cell border border-gray-300 px-4 py-2">
                  {row.requirement_name}
                </td>
                <td className="veriVaView__table-cell border border-gray-300 px-4 py-2">
                  {row.requirement_type || "N/A"}
                </td>
                <td className="veriVaView__table-cell border border-gray-300 px-4 py-2">
                  {row.requirement_status}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan="4"
                className="veriVaView__table-cell border border-gray-300 px-4 py-2 text-center"
              >
                No data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default VeriVaView;
