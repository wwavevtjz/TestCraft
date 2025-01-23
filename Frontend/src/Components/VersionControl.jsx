import React from "react";
import "./CSS/VersionControl.css";

const VersionControl = () => {
  const data = [
    {  status: "verified", modifiedBy: "Messi", date: "12-01-2568 12:01:58" },
    {  status: "waiting for verification", modifiedBy: "Pasin", date: "12-01-2568 10:11:58" },
    {  status: "validation inprogress", modifiedBy: "Phumpipat", date: "12-01-2568 09:01:58" },
    {  status: "validate", modifiedBy: "Nattawut", date: "12-01-2568 09:00:58" },
  ];

  return (
    <div className="version-control">
      <h1>Version Control Requirements</h1>
      <table className="version-table">
        <thead>
          <tr>

            <th>Status</th>
            <th>Modified By</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>

              <td>{item.status}</td>
              <td>{item.modifiedBy}</td>
              <td>{item.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VersionControl;