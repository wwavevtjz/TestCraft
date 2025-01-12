import React from "react";
import { useLocation } from "react-router-dom";
import "./CSS/ViewFile.css";

const ViewFile = () => {
    const location = useLocation();
    const file = location.state?.file;

    if (!file) {
        return <p>No file data available.</p>;
    }

    return (
        <div className="view-file-container">
            <h1>View File</h1>
            <p><strong>ID:</strong> {file.filereq_id}</p>
            <p><strong>File Name:</strong> {file.title || file.filereq_name}</p>
            <p><strong>Requirement ID:</strong> REQ-0{file.requirement_id}</p>
        </div>
    );
};

export default ViewFile;
