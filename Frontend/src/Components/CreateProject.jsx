import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faClipboardList, 
  faUsers, 
  faCalendarAlt, 
  faFileAlt, 
  faTags, 
  faPlus, 
  faTrash, 
  faExclamationTriangle,
  faUserPlus,
  faUsersCog,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import './CSS/CreateProject.css';

// Popup Component with Enterprise Style
const Popup = ({ title, message, onClose, confirmText = 'OK', showCancel = false, onCancel }) => {
  return (
    <div className="create-popup-overlay">
      <div className="create-popup">
        <div className="create-popup-header">
          <h2 className="create-popup-title">{title || 'Notification'}</h2>
        </div>
        <div className="create-popup-body">
          <p className="create-popup-message">{message}</p>
        </div>
        <div className="create-popup-footer">
          {showCancel && (
            <button className="create-popup-cancel" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button className="create-popup-confirm" onClick={onClose}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const CreateProject = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  
  const [formProject, setFormProject] = useState({
    project_name: '',
    project_description: '',
    start_date: '',
    end_date: '',
    project_member: [],
    project_status: 'PENDING', // Default status
  });
  
  // Popup states
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupTitle, setPopupTitle] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  
  // Validation errors
  const [errors, setErrors] = useState({});

  // Fetch members when component mounts
  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/member');
      const memberOptions = response.data.map((member) => ({
        value: member.member_name,
        label: member.member_name,
      }));
      setMembers(memberOptions);
    } catch (error) {
      console.error('Error fetching members:', error);
      showNotification('Error', 'Could not fetch team members. Please try again later.');
    }
  };

  // Handle member selection
  const handleMemberChange = (selectedOption) => {
    setSelectedMember(selectedOption);
    // Clear any previous error
    if (errors.memberName) {
      setErrors({ ...errors, memberName: null });
    }
  };

  // Handle role selection
  const handleRoleChange = (selectedOptions) => {
    setSelectedRoles(selectedOptions);
    // Clear any previous error
    if (errors.memberRole) {
      setErrors({ ...errors, memberRole: null });
    }
  };

  // Format date for input fields
  const formatDateForInput = (date) => {
    if (!date) return '';
    const parsedDate = new Date(date);
    return isNaN(parsedDate) ? '' : parsedDate.toISOString().split('T')[0];
  };

  // Show notification popup
  const showNotification = (title, message) => {
    setPopupTitle(title);
    setPopupMessage(message);
    setShowPopup(true);
    setShowConfirmation(false);
  };

  // Show confirmation popup
  const showConfirmationPopup = (title, message, action) => {
    setPopupTitle(title);
    setPopupMessage(message);
    setConfirmAction(() => action);
    setShowConfirmation(true);
    setShowPopup(true);
  };

  // Handle adding team member
  const handleAddMember = (e) => {
    e.preventDefault();
    
    // Validate input
    const validationErrors = {};
    
    if (!selectedMember) {
      validationErrors.memberName = 'Please select a team member';
    }
    
    if (!selectedRoles || selectedRoles.length === 0) {
      validationErrors.memberRole = 'Please select at least one role';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Check if member already exists
    const existingMember = formProject.project_member.find(
      (member) => member.name === selectedMember.value
    );

    if (existingMember) {
      // Update existing member's roles
      const newRoles = selectedRoles.map((role) => role.value);
      existingMember.roles = [...new Set([...existingMember.roles, ...newRoles])];
      
      // Create a new array to trigger state update
      setFormProject({
        ...formProject,
        project_member: [...formProject.project_member]
      });
      
      showNotification('Member Updated', `Roles updated for ${selectedMember.value}.`);
    } else {
      // Add new member
      const newMember = {
        name: selectedMember.value,
        roles: selectedRoles.map((role) => role.value),
      };
      
      setFormProject({
        ...formProject,
        project_member: [...formProject.project_member, newMember],
      });
    }

    // Reset selections
    setSelectedMember(null);
    setSelectedRoles([]);
  };

  // Handle deleting a team member
  const handleDeleteMember = (memberName) => {
    showConfirmationPopup(
      'Confirm Removal',
      `Are you sure you want to remove ${memberName} from the project team?`,
      () => {
        setFormProject({
          ...formProject,
          project_member: formProject.project_member.filter(
            (member) => member.name !== memberName
          ),
        });
        showNotification('Member Removed', `${memberName} has been removed from the project team.`);
      }
    );
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormProject({
      ...formProject,
      [name]: value
    });
    
    // Clear any error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form data
    const validationErrors = {};
    
    if (!formProject.project_name.trim()) {
      validationErrors.project_name = 'Project name is required';
    }
    
    if (!formProject.project_description.trim()) {
      validationErrors.project_description = 'Project description is required';
    }
    
    if (!formProject.start_date) {
      validationErrors.start_date = 'Start date is required';
    }
    
    if (!formProject.end_date) {
      validationErrors.end_date = 'End date is required';
    } else if (formProject.start_date && new Date(formProject.end_date) < new Date(formProject.start_date)) {
      validationErrors.end_date = 'End date must be after start date';
    }
    
    if (formProject.project_member.length === 0) {
      validationErrors.project_member = 'At least one team member is required';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      
      // Show popup for validation errors
      showNotification(
        'Validation Error',
        'Please fill in all required fields and correct any errors before creating the project.'
      );
      return;
    }
    
    // Determine project status based on dates
    const today = new Date();
    const startDate = new Date(formProject.start_date);
    const endDate = new Date(formProject.end_date);
    let updatedStatus = 'PENDING';

    if (today > endDate) {
      updatedStatus = 'DELAYED';
    } else if (today >= startDate && today <= endDate) {
      updatedStatus = 'IN PROGRESS';
    } else if (today < startDate) {
      updatedStatus = 'PENDING';
    }
    
    // Prepare data for submission
    const projectData = {
      ...formProject,
      project_status: updatedStatus,
      project_member: JSON.stringify(formProject.project_member),
    };
    
    // Submit data to API
    axios.post('http://localhost:3001/project', projectData)
      .then(() => {
        showNotification(
          'Success',
          'Project created successfully! You will be redirected to the Projects page.'
        );
        setTimeout(() => {
          navigate('/Project');
        }, 2000);
      })
      .catch((error) => {
        console.error('Error creating project:', error);
        showNotification(
          'Error',
          'Failed to create project. Please try again later.'
        );
      });
  };

  // Get initials from member name
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Define role options
  const roleOptions = [
    { value: 'Customer', label: 'Customer' },
    { value: 'Analyst', label: 'Analyst' },
    { value: 'Designer', label: 'Designer' },
    { value: 'Developer', label: 'Developer' },
    { value: 'Technical Leader', label: 'Technical Leader' },
    { value: 'Work Team', label: 'Work Team' },
  ];

  // Get role class for styling
  const getRoleClass = (role) => {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('leader') || roleLower.includes('technical')) {
      return 'leader';
    } else if (roleLower.includes('developer')) {
      return 'developer';
    } else if (roleLower.includes('designer')) {
      return 'designer';
    } else if (roleLower.includes('analyst')) {
      return 'analyst';
    } else if (roleLower.includes('customer')) {
      return 'customer';
    } else if (roleLower.includes('team')) {
      return 'team';
    }
    return '';
  };

  return (
    <div className="create-project-page">
      {/* Project Details Section */}
      <div className="create-project create-card">
        <div className="create-card-header">
          <h2 className="create-card-title">
            <FontAwesomeIcon icon={faClipboardList} className="create-card-icon" />
            Create New Project
          </h2>
        </div>
        
        <div className="create-card-body">
          <button onClick={() => navigate('/Project')} className="create-back-button">
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to Projects
          </button>
          
          <form onSubmit={handleSubmit}>
            <div className="create-form-group">
              <label className="create-form-label create-form-required">
                Project Name
              </label>
              <input
                type="text"
                name="project_name"
                value={formProject.project_name}
                onChange={handleInputChange}
                className={`create-form-input ${errors.project_name ? 'create-form-error' : ''}`}
                placeholder="Enter project name"
              />
              {errors.project_name && (
                <span className="create-form-hint">{errors.project_name}</span>
              )}
            </div>
            
            <div className="create-form-group">
              <label className="create-form-label create-form-required">
                Project Description
              </label>
              <textarea
                name="project_description"
                value={formProject.project_description}
                onChange={handleInputChange}
                className={`create-form-textarea ${errors.project_description ? 'create-form-error' : ''}`}
                placeholder="Describe the project objectives, scope, and goals"
                rows="5"
              ></textarea>
              {errors.project_description && (
                <span className="create-form-hint">{errors.project_description}</span>
              )}
              <div className="create-description-notice">
                <FontAwesomeIcon icon={faInfoCircle} style={{ marginRight: '8px' }} />
                <strong>Tip:</strong> A comprehensive description helps all team members understand the project's purpose.
              </div>
            </div>
            
            <div className="create-form-row">
              <div className="create-form-group">
                <label className="create-form-label create-form-required">
                  <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: '8px' }} />
                  Start Date
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formatDateForInput(formProject.start_date)}
                  onChange={handleInputChange}
                  className={`create-form-input ${errors.start_date ? 'create-form-error' : ''}`}
                />
                {errors.start_date && (
                  <span className="create-form-hint">{errors.start_date}</span>
                )}
              </div>
              
              <div className="create-form-group">
                <label className="create-form-label create-form-required">
                  <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: '8px' }} />
                  End Date
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formatDateForInput(formProject.end_date)}
                  onChange={handleInputChange}
                  className={`create-form-input ${errors.end_date ? 'create-form-error' : ''}`}
                />
                {errors.end_date && (
                  <span className="create-form-hint">{errors.end_date}</span>
                )}
              </div>
            </div>
            
            <div className="create-section-divider"></div>
            
            <div className="create-invite-section">
              <div className="create-invite-header">
                <h3 className="create-invite-title">
                  <FontAwesomeIcon icon={faUserPlus} style={{ marginRight: '8px' }} />
                  Invite Team Members
                </h3>
                <p className="create-invite-subtitle">
                  Add team members and assign their roles in the project
                </p>
              </div>
              
              <div className="create-form-row">
                <div className="create-form-group">
                  <label className="create-form-label">Team Member</label>
                  <div className={`create-select-container ${errors.memberName ? 'create-form-error' : ''}`}>
                    <Select
                      placeholder="Select a team member"
                      options={members}
                      value={selectedMember}
                      onChange={handleMemberChange}
                      isClearable
                      classNamePrefix="create-select"
                      styles={{
                        menu: (provided) => ({
                          ...provided,
                          zIndex: 99999,
                        }),
                      }}
                      menuPortalTarget={document.body}
                    />
                  </div>
                  {errors.memberName && (
                    <span className="create-form-hint">{errors.memberName}</span>
                  )}
                </div>
                
                <div className="create-form-group">
                  <label className="create-form-label">Project Roles</label>
                  <div className={`create-select-container ${errors.memberRole ? 'create-form-error' : ''}`}>
                    <Select
                      isMulti
                      placeholder="Select roles"
                      options={roleOptions}
                      value={selectedRoles}
                      onChange={handleRoleChange}
                      classNamePrefix="create-select"
                      styles={{
                        menu: (provided) => ({
                          ...provided,
                          zIndex: 99999,
                        }),
                        multiValue: (provided) => ({
                          ...provided,
                          backgroundColor: 'var(--primary-light)',
                        }),
                        multiValueLabel: (provided) => ({
                          ...provided,
                          color: 'var(--primary-dark)',
                        }),
                      }}
                      menuPortalTarget={document.body}
                    />
                  </div>
                  {errors.memberRole && (
                    <span className="create-form-hint">{errors.memberRole}</span>
                  )}
                </div>
                
                <div style={{ alignSelf: 'flex-end' }}>
                  <button
                    type="button"
                    className="create-btn create-btn-secondary"
                    onClick={handleAddMember}
                  >
                    <FontAwesomeIcon icon={faUserPlus} />
                    Add Member
                  </button>
                </div>
              </div>
              {errors.project_member && (
                <span className="create-form-hint" style={{ display: 'block', marginTop: '8px' }}>
                  {errors.project_member}
                </span>
              )}
            </div>
            
            <div className="create-card-footer">
              <button
                type="button"
                className="create-btn create-btn-neutral"
                onClick={() => navigate('/Project')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="create-btn create-btn-primary"
              >
                <FontAwesomeIcon icon={faPlus} />
                Create Project
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Team Members Section */}
      <div className="create-team-members create-card">
        <div className="create-card-header">
          <h2 className="create-card-title">
            <FontAwesomeIcon icon={faUsersCog} className="create-card-icon" />
            Project Team
          </h2>
          <span className="create-members-count">{formProject.project_member.length}</span>
        </div>
        
        <div className="create-card-body">
          {formProject.project_member.length > 0 ? (
            <table className="create-members-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Roles</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {formProject.project_member.map((member, index) => (
                  <tr key={index}>
                    <td>
                      <div className="create-member-cell">
                        <div className="create-member-avatar">
                          {getInitials(member.name)}
                        </div>
                        <div className="create-member-info">
                          <span className="create-member-name">{member.name}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="create-roles-cell">
                        {member.roles && member.roles.map((role, roleIndex) => (
                          <span
                            key={roleIndex}
                            className={`create-role-badge ${getRoleClass(role)}`}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="create-actions-cell">
                        <button
                          type="button"
                          className="create-btn create-btn-circle create-btn-danger"
                          onClick={() => handleDeleteMember(member.name)}
                          title="Remove member"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="create-empty-state">
              <div className="create-empty-icon">
                <FontAwesomeIcon icon={faUsers} size="2x" />
              </div>
              <h3 className="create-empty-title">No team members added yet</h3>
              <p className="create-empty-message">
                Use the form on the left to add team members to your project.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Popup Notifications */}
      {showPopup && !showConfirmation && (
        <Popup
          title={popupTitle}
          message={popupMessage}
          onClose={() => setShowPopup(false)}
        />
      )}
      
      {/* Confirmation Popup */}
      {showPopup && showConfirmation && (
        <Popup
          title={popupTitle}
          message={popupMessage}
          onClose={() => {
            setShowPopup(false);
            setShowConfirmation(false);
            if (confirmAction) confirmAction();
          }}
          confirmText="Yes, Remove"
          showCancel={true}
          onCancel={() => {
            setShowPopup(false);
            setShowConfirmation(false);
          }}
        />
      )}
    </div>
  );
};

export default CreateProject;