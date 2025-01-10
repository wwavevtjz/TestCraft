import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import './CSS/ViewEditReq.css';

const ViewEditReq = () => {
    const location = useLocation();
    const [requirement, setRequirement] = useState(null);

    // Function to fetch Requirement data from API
    useEffect(() => {
        const fetchRequirement = async (requirementId) => {
            try {
                const response = await axios.get(`http://localhost:3001/requirement/${requirementId}`);
                setRequirement(response.data); // Set Requirement data from API
            } catch (error) {
                console.error('Error fetching requirement:', error);
            }
        };

        // Use state data if passed, else fetch data from API based on query params
        if (location.state && location.state.requirement) {
            setRequirement(location.state.requirement);
        } else if (location.search) {
            const queryParams = new URLSearchParams(location.search);
            const requirementId = queryParams.get('requirement_id');
            if (requirementId) {
                fetchRequirement(requirementId);
            }
        }
    }, [location]);

    return (
        <div className="view-requirement-container">
            <div className="view-requirement-header-with-button">
                <h1 className="view-requirement-title">Requirement: {requirement?.requirement_name}</h1>
            </div>

            <div className="view-requirement-header">
                <p>
                    <strong className="view-requirement-label">ID:</strong> REQ-0{requirement?.requirement_id}
                </p>
                <p>
                    <strong className="view-requirement-label">Type:</strong> {requirement?.requirement_type}
                </p>
                <p>
                    <strong className="view-requirement-label">Status:</strong> {requirement?.requirement_status}
                </p>
                <p>
                    <strong className="view-requirement-label">File ID:</strong> <span className="file-id-highlight">{requirement?.filereq_id}</span>
                </p>
            </div>
            <div className="view-requirement-text">
                <p><strong className="view-requirement-description">Description:</strong></p>
                <p className="view-requirement-paragraph">{requirement?.requirement_description}</p>
            </div>
        </div>
    );
};

export default ViewEditReq;
