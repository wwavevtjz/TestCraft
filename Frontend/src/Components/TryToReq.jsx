import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const TryToReq = () => {
    const [requirements, setRequirements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const projectId = queryParams.get('project_id');

    useEffect(() => {
        if (projectId) {
            setLoading(true);
            axios
                .get(`http://localhost:3001/project/${projectId}/requirement`)
                .then((res) => {
                    setRequirements(res.data);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error('Error fetching requirements:', err);
                    setError('Failed to load requirements. Please try again.');
                    setLoading(false);
                });
        }
    }, [projectId]);

    return (
        <div className="requirement-page">
            <h1 className="requirement-title">Requirements for Project {projectId}</h1>
            {loading ? (
                <p>Loading requirements...</p>
            ) : error ? (
                <p className="error-message">{error}</p>
            ) : requirements.length === 0 ? (
                <p>No requirements found for this project.</p>
            ) : (
                <table className="requirement-table">
                    <thead>
                        <tr>
                            <th>Requirement Name</th>
                            <th>Type</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requirements.map((req) => (
                            <tr key={req.requirement_id}>
                                <td>{req.requirement_name}</td>
                                <td>{req.requirement_type}</td>
                                <td>{req.requirement_description}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default TryToReq;
