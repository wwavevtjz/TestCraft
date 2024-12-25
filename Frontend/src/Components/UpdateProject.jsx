import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select';
import './CSS/UpdateProject.css';
import closeicon from '../image/close.png';

const UpdateProject = () => {
    const { id } = useParams();
    const [members, setMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [formEditProject, setFormEditProject] = useState({
        project_name: '',
        project_description: '',
        project_member: [],
        start_date: '',
        end_date: '',
        project_status: '',
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        axios
            .get(`http://localhost:3001/project/${id}`)
            .then((res) => {
                const projectData = res.data;
                setFormEditProject({
                    project_name: projectData.project_name,
                    project_description: projectData.project_description,
                    project_member: JSON.parse(projectData.project_member) || [],
                    start_date: projectData.start_date || '',
                    end_date: projectData.end_date || '',
                    project_status: projectData.project_status || '',
                });
                setTeamMembers(JSON.parse(projectData.project_member) || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching project data:', err);
                setLoading(false);
            });
    }, [id]);

    useEffect(() => {
        axios
            .get('http://localhost:3001/member')
            .then((res) => {
                const memberOptions = res.data.map((member) => ({
                    value: member.member_name,
                    label: `${member.member_name}`,
                }));
                setMembers(memberOptions);
            })
            .catch((err) => console.error('Error fetching members:', err));
    }, []);

    const handleMemberChange = (selectedOption) => {
        setSelectedMember(selectedOption);
    };

    const handleRoleChange = (selectedOptions) => {
        setSelectedRoles(selectedOptions);
    };

    const handleAddMember = (e) => {
        e.preventDefault();
        if (selectedMember && selectedRoles.length > 0) {
            const newMember = {
                name: selectedMember.value,
                roles: selectedRoles.map((role) => role.value),
            };
            setTeamMembers([...teamMembers, newMember]);
            setSelectedMember(null);
            setSelectedRoles([]);
        }
    };

    const handleDeleteMember = (index) => {
        const updatedTeamMembers = teamMembers.filter((_, idx) => idx !== index);
        setTeamMembers(updatedTeamMembers);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formEditProject.project_name.trim() || !formEditProject.start_date || !formEditProject.end_date) {
            alert('Please fill in all required fields');
            return;
        }

        const updatedProject = {
            ...formEditProject,
            project_member: JSON.stringify(
                teamMembers.map((member) => ({
                    name: member.name,
                    roles: member.roles,
                }))
            ),
        };

        axios
            .put(`http://localhost:3001/project/${id}`, updatedProject)
            .then(() => {
                alert('Project updated successfully!');
                navigate('/Project');
            })
            .catch((err) => {
                console.error('Error updating project:', err);
                alert('Failed to update project');
            });
    };

    const formatDateForInput = (date) => {
        if (!date) return '';
        const parsedDate = new Date(date);
        return isNaN(parsedDate) ? '' : parsedDate.toISOString().split('T')[0];
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="project-page">
            <div className="update-project">
                <div className="form-box">
                    <h2>Update Project</h2>
                    <form onSubmit={handleSubmit}>
                        <label>
                            Project Name:
                            <input
                                type="text"
                                value={formEditProject.project_name}
                                onChange={(e) =>
                                    setFormEditProject({ ...formEditProject, project_name: e.target.value })
                                }
                            />
                        </label>
                        <label>
                            Project Description:
                            <textarea
                                value={formEditProject.project_description}
                                onChange={(e) =>
                                    setFormEditProject({ ...formEditProject, project_description: e.target.value })
                                }
                            />
                        </label>
                        <div className="date-inputs">
                            <label>
                                Start Date:
                                <input
                                    type="date"
                                    value={formatDateForInput(formEditProject.start_date)}
                                    onChange={(e) =>
                                        setFormEditProject({ ...formEditProject, start_date: e.target.value })
                                    }
                                />
                            </label>
                            <label>
                                End Date:
                                <input
                                    type="date"
                                    value={formatDateForInput(formEditProject.end_date)}
                                    onChange={(e) =>
                                        setFormEditProject({ ...formEditProject, end_date: e.target.value })
                                    }
                                />
                            </label>
                        </div>
                        <label>
                            Project Status:
                            <select
                                value={formEditProject.project_status || 'Select Status'}
                                onChange={(e) =>
                                    setFormEditProject({ ...formEditProject, project_status: e.target.value })
                                }
                            >
                                <option value="Select Status" disabled>
                                    Select Status
                                </option>
                                <option value="DRAFT">DRAFT</option>
                                <option value="IN PROGRESS">IN PROGRESS</option>
                                <option value="CLOSED">CLOSED</option>
                            </select>
                        </label>
                        <button type="submit">Update Project</button>
                    </form>
                </div>

                <div className="team-box">
                    <h2>Team Members</h2>
                    <div className="add-member">
                        <p>Invite Team Member</p>
                        <Select
                            options={members}
                            value={selectedMember}
                            onChange={handleMemberChange}
                            placeholder="Select Member"
                        />
                        <Select
                            isMulti
                            options={[
                                { value: 'Product Owner', label: 'Product Owner' },
                                { value: 'Designer', label: 'Designer' },
                                { value: 'Tester', label: 'Tester' },
                                { value: 'Developer', label: 'Developer' },
                            ]}
                            value={selectedRoles}
                            onChange={handleRoleChange}
                            placeholder="Select Roles"
                        />
                        <button onClick={handleAddMember}>Add Member</button>
                    </div>

                    <div className="team-members-list">
                        {teamMembers.map((member, index) => (
                            <div key={index} className="team-member">
                                <span>{member.name}</span>
                                <span>Roles: {member.roles.join(', ')}</span>
                                <button className="delete-button" onClick={() => handleDeleteMember(index)}>
                                    <img src={closeicon} alt="Close Icon" className="closeicon" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdateProject;
