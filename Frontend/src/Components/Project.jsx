import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';
import './CSS/Project.css';

const Project = () => {
  const [projectList, setProjectList] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get('http://localhost:3001/project')
      .then((res) => {
        setProjectList(res.data);
        setFilteredProjects(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching project data:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const filtered = searchQuery
      ? projectList.filter((project) =>
        project.project_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      : projectList;
    setFilteredProjects(filtered);
  }, [searchQuery, projectList]);

  const handleUpdateProject = (id) => {
    navigate(`/UpdateProject/${id}`);
  };

  const handleDeleteProject = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/project/${id}`);
      setProjectList(projectList.filter((project) => project.project_id !== id));
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  const handleNavigateToDashboard = (id) => {
    navigate(`/Dashboard?project_id=${id}`);
  };

  const calculateDaysRemaining = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const difference = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    return difference > 0 ? `${difference} days` : 'Expired';
  };

  return (
    <div className="topic-project">
      <div className="top-section">
        <h1 className="project-title">Project Information</h1>
        <button onClick={() => navigate('/CreateProject')} className="create-project-btn">
          Create Project
        </button>
      </div>

      <div className="content-container">
        <div className="project-section">
          <div className="project-search">
            <input
              type="text"
              className="project-search-input"
              placeholder="Search Project"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                Clear
              </button>
            )}
            <FontAwesomeIcon icon={faMagnifyingGlass} className="search-icon" />
          </div>


          {loading ? (
            <p>Loading projects...</p>
          ) : (
            <table className="project-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Description</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Remaining Days</th>
                  <th>Actions</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan="6">No projects available</td>
                  </tr>
                ) : (
                  filteredProjects.map((project) => (
                    <tr key={project.project_id}>
                      <td
                        className="project-name-link"
                        onClick={() => handleNavigateToDashboard(project.project_id)}
                      >
                        {project.project_name}
                      </td>
                      <td>{project.project_description}</td>
                      <td>
                        {new Date(project.start_date).toLocaleDateString('th-TH', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td>
                        {new Date(project.end_date).toLocaleDateString('th-TH', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td>{calculateDaysRemaining(project.end_date)}</td>
                      <td>
                        <button
                          onClick={() => handleUpdateProject(project.project_id)}
                          className="action-button edit-req"
                        >
                          <FontAwesomeIcon icon={faPenToSquare} className="action-icon" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.project_id)}
                          className="action-button delete-req"
                        >
                          <FontAwesomeIcon icon={faTrash} className="action-icon" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Project;
