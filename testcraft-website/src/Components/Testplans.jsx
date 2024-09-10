import React, { useEffect, useState } from 'react';
import './Testplans.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function TestPlans() {
  const [testplans, setTestplans] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:3001/createproject')
      .then(res => setTestplans(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleUpdate = (id) => {
    navigate(`/UpdateTestplan/${id}`);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/createproject/${id}`);
      setTestplans(testplans.filter(plan => plan.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="test-plans">
      <button 
        onClick={() => navigate('/CreateProject')} 
        className='btn btn-success create-btn'
      >
        Create Test Plan +
      </button>
      <h2>Test Plans</h2>
      <table className='table'>
        <thead>
          <tr>
            <th>ID</th>
            <th>Test Plan Name</th>
            <th>Description</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {
            testplans.map((data) => (
              <tr key={data.id}>
                <td>{data.id}</td>
                <td>{data.name}</td>
                <td>{data.description}</td>
                <td>
                  <button 
                    onClick={() => handleUpdate(data.id)} 
                    className='btn btn-primary action-btn'
                  >
                    Update
                  </button>
                  <button 
                    onClick={() => handleDelete(data.id)} 
                    className='btn btn-danger action-btn'
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}

export default TestPlans;
