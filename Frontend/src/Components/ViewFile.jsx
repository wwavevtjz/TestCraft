import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { FaEye } from "react-icons/fa";
import Modal from "react-modal";
import "./CSS/ViewFile.css";

const ViewFile = () => {
    const [searchParams] = useSearchParams();
    const filereq_id = searchParams.get("filereq_id");

    const [fileData, setFileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fileUrl, setFileUrl] = useState(null);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (!filereq_id) {
            setError("Invalid file request ID");
            setLoading(false);
            return;
        }

        axios.get(`http://localhost:3001/api/file/${filereq_id}`)
            .then(response => {
                setFileData(response.data);
                setLoading(false);
            })
            .catch(() => {
                setError("Failed to fetch file metadata");
                setLoading(false);
            });

        axios.get(`http://localhost:3001/api/file/content/${filereq_id}`, { responseType: "blob" })
            .then(response => {
                const fileBlob = new Blob([response.data], { type: "application/pdf" });
                setFileUrl(URL.createObjectURL(fileBlob));
            })
            .catch(() => {
                setError("Failed to fetch file content");
            });
    }, [filereq_id]);

    if (loading) return <p>Loading file data...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className="view-file-container-custom">
            <h1 className="view-file-title-custom">View File</h1>

            {fileData && (
                <div className="view-file-metadata">
                    <p><strong>File Name:</strong> {fileData[0]?.filereq_name}</p>
                    <p><strong>Uploaded At:</strong> {new Date(fileData[0]?.uploaded_at).toLocaleString()}</p>
                    <div className="requirement-container">
                        <strong>Requirement Id:</strong>
                        <button 
                            className="eye-button" 
                            onClick={() => setModalIsOpen(true)}
                        >
                            <FaEye size={20} />
                        </button>
                    </div>
                </div>
            )}

            <Modal 
                isOpen={modalIsOpen} 
                onRequestClose={() => setModalIsOpen(false)}
                className="modal-content"
                overlayClassName="modal-overlay"
            >
                <h2 className="modal-title">Requirement IDs</h2>
                <input 
                    type="text" 
                    placeholder="Search Requirement ID..." 
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <ul className="requirement-list">
                    {fileData
                        .filter(data => data.requirement_id.toString().includes(searchTerm))
                        .map((data, index) => (
                            <li key={index} className="requirement-item">REQ-00{data.requirement_id}</li>
                        ))}
                </ul>
                <button className="close-button" onClick={() => setModalIsOpen(false)}>Close</button>
            </Modal>

            <div className="view-file-box-custom">
                <h2 className="view-file-box-title-custom">File Preview</h2>
                {fileUrl ? (
                    <iframe 
                        src={fileUrl} 
                        className="view-file-pdf-custom" 
                    />
                ) : (
                    <p className="view-file-box-content-custom">No file available</p>
                )}
            </div>
        </div>
    );
};

export default ViewFile;