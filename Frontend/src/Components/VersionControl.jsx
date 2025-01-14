import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import './CSS/VersionControl.css';

const VersionControl = () => {
    const { id } = useParams(); // Get the criteria ID from the URL
    const [history, setHistory] = useState([]);
    const navigate = useNavigate();

    // Log actions (e.g., add, update)
    const logAction = async (action, reqcri_id, modified_by) => {
        try {
            await axios.post("http://localhost:3001/reqcriteria/log", {
                reqcri_id,
                action,
                modified_by,
            });
            console.log("Action logged successfully");
        } catch (error) {
            console.error("Error logging action:", error);
        }
    };

    // Format date for display
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Fetch history for the specific criteria
    const fetchHistory = useCallback(async () => {
        try {
            const response = await axios.get(`http://localhost:3001/reqcriteria/history/${id}`);
            setHistory(response.data);
        } catch (error) {
            console.error("Error fetching history:", error);
        }
    }, [id]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // Add a new criterion
    const addCriterion = async (newCriterionData) => {
        try {
            const response = await axios.post("http://localhost:3001/reqcriteria/add", newCriterionData);
            const newCriterionId = response.data.id;

            // Log the action
            await logAction("Added", newCriterionId, "User Name");
            console.log("Criterion added and action logged.");
            fetchHistory(); // Refresh history after adding
        } catch (error) {
            console.error("Error adding criterion:", error);
        }
    };

    // Update an existing criterion
    const updateCriterion = async (id, updatedData) => {
        try {
            await axios.put(`http://localhost:3001/reqcriteria/update/${id}`, updatedData);
            await logAction("Updated", id, "User Name");
            console.log("Criterion updated and action logged.");
            fetchHistory(); // Refresh history after update
        } catch (error) {
            console.error("Error updating criterion:", error);
        }
    };

    return (
        <div className="version-control-container">
            <h1>Change History</h1>
            <button onClick={() => navigate(-1)} className="back-button">
                Back
            </button>
            {history.length === 0 ? (
                <p>No history available for this criteria.</p>
            ) : (
                <table className="history-table">
                    <thead>
                        <tr>
                            <th>Action</th>
                            <th>Modified By</th>
                            <th>Date</th>
                            <th>Criteria Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((entry) => (
                            <tr key={entry.id}>
                                <td>{entry.action}</td>
                                <td>{entry.modified_by}</td>
                                <td>{formatDate(entry.modified_at)}</td>
                                <td>{entry.reqcri_name}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default VersionControl;
