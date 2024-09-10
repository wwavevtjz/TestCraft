import React, { useEffect, useState } from 'react';
import './UpdateTestplan.css';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';

const UpdateTestplan = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch the current data for the test plan
  useEffect(() => {
    axios.get(`http://localhost:3001/createproject/${id}`)
      .then(res => {
        setName(res.data.name);
        setDescription(res.data.description);
      })
      .catch(error => {
        console.error('Error fetching the Test Plan data!', error);
      });
  }, [id]);

  const handleUpdateTestplan = (event) => {
    event.preventDefault();
    axios.put(`http://localhost:3001/createproject/${id}`, { 
      name,
      description
    })
    .then(res => {
      console.log('Test Plan updated:', res);
      navigate('/test-plans');
    })
    .catch(error => {
      console.error('Error updating the Test Plan!', error);
    });
  };

  const handleCancel = () => {
    navigate('/test-plans');
  };

  return (
    <div className="create-project">
      <h2>Update Test Plan</h2>
      <form onSubmit={handleUpdateTestplan}>
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
        <button type="submit" className="submit-button">Update</button>
        <button type="button" onClick={handleCancel} className="btn btn-danger">Cancel</button>
      </form>
    </div>
  );
};

export default UpdateTestplan;
