import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Modal, Button } from 'react-bootstrap';
import './CSS/Project.css';
import { toast } from 'react-toastify';
import clearsearch from '../image/clearsearch.png';

const Project = () => {
  const [projectList, setProjectList] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
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

  const handleDeleteConfirmation = (project) => {
    setProjectToDelete(project);
    setShowModal(true);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      await axios.delete(`http://localhost:3001/project/${projectToDelete.project_id}`);
      setProjectList(projectList.filter((project) => project.project_id !== projectToDelete.project_id));
      setShowModal(false);
      setProjectToDelete(null);
      toast.success(`Delete Project "${projectToDelete.project_name}" Success`, { position: "top-right" });
    } catch (err) {
      toast.error(`Error deleting project: ${err.message}`);
    }
  };

  const handleNavigateToDashboard = (id) => {
    navigate(`/Dashboard?project_id=${id}`, { state: { selectedSection: 'Requirement' } });
  };

  const calculateDaysRemaining = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const difference = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    return difference > 0 ? `${difference} days` : 'Expired';
  };

  const handleShowDetails = (project) => {
    setSelectedProject(project);
  };

  return (
    <div className="project-container">
      <div className="project-top-section">
        <h1 className="project-title">Project Information</h1>
        <button onClick={() => navigate('/CreateProject')} className="project-create-btn">Create Project</button>
      </div>
  
      <div className="project-content-container">
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
              <img
                src={clearsearch}
                alt="clearsearch-project"
                className="project-clearsearch"
                onClick={() => setSearchQuery('')}
              />
            )}
            <FontAwesomeIcon icon={faMagnifyingGlass} className="project-search-icon" />
          </div>
  
          {loading ? (
            <p className="project-loading">Loading projects...</p>
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
                    <td colSpan="7" className="project-no-data">No projects available</td>
                  </tr>
                ) : (
                  filteredProjects.map((project) => (
                    <tr key={project.project_id}>
                      <td className="project-name-link" onClick={() => handleNavigateToDashboard(project.project_id)}>
                        {project.project_name}
                      </td>
                      <td>
                        {project.project_description.substring(0, 50)}...
                        <button onClick={() => handleShowDetails(project)} className="project-view-more-btn">
                          View More
                        </button>
                      </td>
                      <td>{new Date(project.start_date).toLocaleDateString('th-TH')}</td>
                      <td>{new Date(project.end_date).toLocaleDateString('th-TH')}</td>
                      <td>{calculateDaysRemaining(project.end_date)}</td>
                      <td>
                        <button onClick={() => handleUpdateProject(project.project_id)} className="project-action-btn project-edit-btn">
                          <FontAwesomeIcon icon={faPenToSquare} className="project-action-icon" />
                        </button>
                        <button onClick={() => handleDeleteConfirmation(project)} className="project-action-btn project-delete-btn">
                          <FontAwesomeIcon icon={faTrash} className="project-action-icon" />
                        </button>
                      </td>
                      <td>
                        <span className={project.project_status === 'CLOSE' ? 'project-closed-status' : ''}>
                          {project.project_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
  
      <Modal show={!!selectedProject} onHide={() => setSelectedProject(null)}>
        <Modal.Header closeButton>
          <Modal.Title className='title-project-detail'>Project Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProject && (
            <div className="project-details">

              <p><strong>Description:</strong> {selectedProject.project_description}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelectedProject(null)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Project;
