import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import './CSS/ViewEditReq.css';

const ViewEditReq = () => {
    const location = useLocation();
    const [requirement, setRequirement] = useState(null);
    const [isEditing, setIsEditing] = useState(false); // State to track edit mode

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

    // Handle form submission for updating the requirement
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(`http://localhost:3001/requirement/${requirement.requirement_id}`, requirement);
            console.log('Requirement updated:', response.data);
            setIsEditing(false); // Exit edit mode after successful update
        } catch (error) {
            console.error('Error updating requirement:', error);
        }
    };

    // Handle input changes to update requirement data
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setRequirement((prevRequirement) => ({
            ...prevRequirement,
            [name]: value
        }));
    };

    // Handle cancel edit
    const handleCancel = () => {
        setIsEditing(false); // Exit edit mode without saving
    };

    if (!requirement) {
        return <p className="loading-text">Loading...</p>;
    }

    return (
        <div className="view-requirement-container">
            <div className="view-requirement-header-with-button">
                <h1 className="view-requirement-title">Requirement: {requirement.requirement_name}</h1>
                <button
                    className='edit-requirement-button'
                    onClick={() => setIsEditing(!isEditing)}
                    style={{ display: isEditing ? 'none' : 'block' }}
                >
                    EDIT
                </button>


            </div>

            {/* Show editing header when in edit mode */}
            {/* {isEditing && <h2 className="edit-mode-header">Edit Requirement</h2>} */}

            <form onSubmit={handleSubmit}>
                <div className="view-requirement-header">
                    <p>
                        <strong className="view-requirement-label">ID:</strong> REQ-0{requirement.requirement_id}
                    </p>
                    {isEditing ? (
                        <input
                            type="text"
                            name="requirement_name"
                            value={requirement.requirement_name}
                            onChange={handleInputChange}
                        />
                    ) : (
                        <p><strong className="view-requirement-label">Name:</strong> {requirement.requirement_name}</p>
                    )}

                    {isEditing ? (
                        <input
                            type="text"
                            name="requirement_type"
                            value={requirement.requirement_type}
                            onChange={handleInputChange}
                        />
                    ) : (
                        <p><strong className="view-requirement-label">Type:</strong> {requirement.requirement_type}</p>
                    )}

                    {isEditing ? (
                        <input
                            type="text"
                            name="requirement_status"
                            value={requirement.requirement_status}
                            onChange={handleInputChange}
                        />
                    ) : (
                        <p><strong className="view-requirement-label">Status:</strong> {requirement.requirement_status}</p>
                    )}

                    {isEditing ? (
                        <input
                            type="text"
                            name="filereq_id"
                            value={requirement.filereq_id}
                            onChange={handleInputChange}
                        />
                    ) : (
                        <p><strong className="view-requirement-label">File ID:</strong> <span className="file-id-highlight">{requirement.filereq_id}</span></p>
                    )}
                </div>
                <div className="view-requirement-text">
                    <p><strong className="view-requirement-description">Description:</strong></p>
                    {isEditing ? (
                        <textarea
                            name="requirement_description"
                            value={requirement.requirement_description}
                            onChange={handleInputChange}
                        />
                    ) : (
                        <p className="view-requirement-paragraph">{requirement.requirement_description}</p>
                    )}
                </div>
                {isEditing && (
                    <div className="edit-buttons">
                        <button type="button" className="cancel-button" onClick={handleCancel}>Cancel</button>
                        <button type="submit" className="save-button">Save Changes</button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default ViewEditReq;
