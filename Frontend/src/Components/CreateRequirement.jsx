import React, { useState } from 'react';
import axios from 'axios';
import './CSS/CreateRequirement.css';
import { useNavigate } from 'react-router-dom';

const CreateRequirement = () => {
  const [requirementStatement, setRequirementStatement] = useState('');
  const [requirementType, setRequirementType] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(window.location.search);
  const projectId = queryParams.get('project_id');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!requirementStatement || !requirementType || !description) {
      setError("Please fill in all fields.");
      return;
    }

    const newRequirement = {
      requirement_name: requirementStatement,
      requirement_type: requirementType,
      requirement_description: description,
      project_id: projectId,  // ส่ง projectId ไปด้วย
    };

    try {
      const response = await axios.post('http://localhost:3001/requirement', newRequirement);

      if (response.status === 201) {
        alert('Requirement created successfully');
        navigate(`/Dashboard?project_id=${projectId}`, {
          state: { selectedSection: 'Requirement' }, // เลือก section Requirement
        });  // Redirect ไปที่ Dashboard และไปที่ค่า selectedSection เป็น 'Requirement'
      } else {
        console.error("Failed to create requirement:", response);
        alert('Failed to create requirement');
      }
    } catch (error) {
      console.error('Error creating requirement:', error);
      if (error.response) {
        setError(error.response.data.message || 'Something went wrong');
      } else {
        setError('Network error. Please try again.');
      }
    }
  };

  return (
    <div className="requirement-specification">
      <h1>Create New Requirement</h1>
      {error && <p className="error-message">{error}</p>}
      <form className="requirement-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="requirementStatement">Requirement Statement</label>
          <input
            type="text"
            id="requirementStatement"
            value={requirementStatement}
            onChange={(e) => setRequirementStatement(e.target.value)}
            placeholder="Enter requirement statement"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="requirementType">Type</label>
          <select
            id="requirementType"
            value={requirementType}
            onChange={(e) => setRequirementType(e.target.value)}
            required
          >
            <option value="" disabled>Select Type</option>
            <option value="Functional">Functionality</option>
            <option value="User interface">User interface</option>
            <option value="External interfaces">External interfaces</option>
            <option value="Reliability">Reliability</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Portability">Portability</option>
            <option value="Limitations Design and construction">Limitations Design and construction</option>
            <option value="Interoperability">Interoperability</option>
            <option value="Reusability">Reusability</option>
            <option value="Legal and regulative">Legal and regulative</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter requirement description"
            rows="4"
            required
          ></textarea>
        </div>
        <div className="form-buttons">
          <button
            type="button"
            className="btn btn-back"
            onClick={() => navigate(`/Dashboard?project_id=${projectId}`, { state: { selectedSection: 'Requirement' } })}
          >
            Back to Requirements
          </button>
          <button type="submit" className="btn btn-primary">
            Create
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateRequirement;
