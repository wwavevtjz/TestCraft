import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import "./CSS/Uploadfile.css";

const UploadFile = ({ onClose, onUploadSuccess }) => { // เพิ่ม onUploadSuccess
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState("");
    const [title, setTitle] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        setFileName(selectedFile ? selectedFile.name : "");
    };

    const handleSave = async () => {
        if (!file) {
            alert("Please select a file.");
            return;
        }
        if (!title) {
            alert("Please enter a title.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", title);

        setIsUploading(true);

        try {
            const response = await axios.post("http://localhost:3001/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const newFile = response.data; // File data returned from backend
            alert("File uploaded successfully.");

            if (onUploadSuccess) {
                onUploadSuccess(newFile); // Pass file data to RequirementPage
            }

            onClose();
        } catch (error) {
            console.error("Error uploading file:", error.response || error.message);
            alert("Failed to upload file. Please try again.");
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

            <div className="form-group">
                <label htmlFor="title">Title:</label>
                <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter file title"
                    disabled={isUploading}
                />
            </div>

            <label htmlFor="file-upload" className="upload-button">
                <FontAwesomeIcon icon={faUpload} className="upload-button-icon" />
                <span className="upload-text">Upload File</span>
            </label>
            <input
                id="file-upload"
                type="file"
                accept="application/pdf"
                style={{ display: "none" }}
                onChange={handleFileChange}
            />

            {fileName && <div className="file-name">Selected File: {fileName}</div>}

            <button className="save-button" onClick={handleSave} disabled={isUploading}>
                {isUploading ? "Uploading..." : "Save"}
            </button>
        </div>
    );
};

export default UploadFile;
