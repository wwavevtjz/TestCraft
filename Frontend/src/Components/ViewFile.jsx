import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./CSS/ViewFile.css";

const ViewFile = () => {
    const location = useLocation();
    const file = location.state?.file;

    useEffect(() => {
        console.log("File data received in ViewFile:", file);
    }, [file]);

    if (!file) {
        return <p>No file data available.</p>;
    }

    return (
        <div className="view-file-container-custom">
            <h1 className="view-file-title-custom">View File</h1>
            <p className="view-file-id-custom"><strong>File ID:</strong> {file.filereq_id}</p>
            <p className="view-file-name-custom"><strong>File Name:</strong> {file.filereq_name || "No name available"}</p>
            <p className="view-file-requirement-custom"><strong>Requirement ID:</strong>
                {file.requirement_ids && file.requirement_ids.length > 0
                    ? file.requirement_ids.map(id => `REQ-${id}`).join(", ")
                    : "-"}
            </p>
        </div>
    );
};

export default ViewFile;
