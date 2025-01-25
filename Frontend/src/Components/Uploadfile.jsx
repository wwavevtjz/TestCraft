import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import "./CSS/Uploadfile.css";

const UploadFile = ({ onClose, onUploadSuccess, projectId, requirementId }) => {
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState("");
    const [title, setTitle] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        setFileName(selectedFile ? selectedFile.name : "");
    };

    const handleSave = async () => {
        if (!file) {
            setErrorMessage("Please select a file.");
            return;
        }
        if (!title) {
            setErrorMessage("Please enter a title.");
            return;
        }
        if (file && file.size > 10 * 1024 * 1024) {
            setErrorMessage("File size exceeds 10MB. Please upload a smaller file.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", title);
        formData.append("project_id", projectId);  // Send projectId
        formData.append("requirement_id", requirementId);  // Send requirementId

        // Check the formData before sending
        console.log("Form Data before sending:");
        for (let pair of formData.entries()) {
            console.log(pair[0] + ": " + pair[1]);
        }

        setIsUploading(true);
        setErrorMessage(""); // Reset error message

        try {
            const response = await axios.post("http://localhost:3001/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const newFile = response.data;
            alert("File uploaded successfully.");
            if (onUploadSuccess) {
                onUploadSuccess(newFile);
            }
            onClose();
        } catch (error) {
            console.error("Error uploading file:", error.response || error.message);
            setErrorMessage("Failed to upload file. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="upload-file-container">
            <button className="upload-file-close" onClick={onClose} disabled={isUploading}>
                ×
            </button>
            <div className="upload-file-header">Add File</div>

            {errorMessage && <div className="error-message">{errorMessage}</div>}  {/* Display error message */}

            <div className="form-group">
                <label htmlFor="title">Title:</label>
                <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter file title"
                    disabled={isUploading}
                    aria-label="File title"
                />
            </div>

            <label htmlFor="file-upload" className="upload-button" aria-label="Upload file">
                <FontAwesomeIcon icon={faUpload} className="upload-button-icon" />
                <span className="upload-text">Upload File</span>
            </label>
            <input
                id="file-upload"
                type="file"
                accept="application/pdf"
                style={{ display: "none" }}
                onChange={handleFileChange}
                aria-label="Choose file"
            />

            {fileName && <div className="file-name">Selected File: {fileName}</div>}

            <button className="save-button" onClick={handleSave} disabled={isUploading}>
                {isUploading ? "Uploading..." : "Save"}
            </button>
        </div>
    );
};

export default UploadFile;
