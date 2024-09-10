import React, { useState } from 'react';
import './CreateProject.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateProject = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const navigate = useNavigate();

  const handleCreateProject = (event) => {
    event.preventDefault();
    axios.post('http://localhost:3001/createproject', {
      name,
      description
    })
    .then(res => {
      console.log(res);
      navigate('/test-plans');
    })
    .catch(error => {
      console.error('error creating the Test plan!', error);
    });
  };

  const handleCancel = () => {
    navigate('/test-plans');
  };

  return (
    <div className="create-project">
      <h2>Create New Test Plan</h2>
      <form onSubmit={handleCreateProject}>
        <div className="form-group">
          <label htmlFor="projectName">Test Plan Name:</label>
          <input
            type="text"
            id="projectName"
            className="form-control"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter Test Plan Name"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            className="form-control"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Enter Description"
            required
          />
        </div>
        <button type="submit" className="create-button">Create Test Plan</button>
        <button type="button" onClick={handleCancel} className="cancel-button">Cancel</button>
      </form>
    </div>
  );
};

export default CreateProject;
