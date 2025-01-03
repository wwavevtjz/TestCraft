import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select';
import './CSS/CreateProject.css';
import closeicon from '../image/close.png';
import backarrow from '../image/arrow_left.png';

const UpdateProject = () => {
    const [members, setMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [formProject, setFormProject] = useState({
        project_name: '',
        project_description: '',
        start_date: '',
        end_date: '',
        project_member: [],
        project_status: 'PENDING',
    });
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');
    const navigate = useNavigate();
    const { id } = useParams(); // Get project ID from the URL

    useEffect(() => {
        // Fetch project details
        axios
            .get(`http://localhost:3001/project/${id}`)
            .then((res) => {
                const project = res.data;
                setFormProject({
                    ...project,
                    start_date: formatDateForInput(project.start_date),
                    end_date: formatDateForInput(project.end_date),
                    project_member: JSON.parse(project.project_member),
                });
            })
            .catch((err) => console.log('Error fetching project details:', err));
    
        // Fetch members for selection
        axios
            .get('http://localhost:3001/member')
            .then((res) => {
                const memberOptions = res.data.map((member) => ({
                    value: member.member_name,
                    label: `${member.member_name}`,
                }));
                setMembers(memberOptions);
            })
            .catch((err) => console.log('Error fetching members:', err));
    }, [id]);    

    const handleMemberChange = (selectedOption) => {
        setSelectedMember(selectedOption);
    };

    const handleRoleChange = (selectedOptions) => {
        setSelectedRoles(selectedOptions);
    };

    const handleAddMember = (e) => {
        e.preventDefault();

        if (selectedMember && selectedRoles.length > 0) {
            const existingMember = formProject.project_member.find(
                (member) => member.name === selectedMember.value
            );

            if (existingMember) {
                existingMember.roles = existingMember.roles || [];
                const newRoles = selectedRoles.map((role) => role.value);
                existingMember.roles = [...new Set([...existingMember.roles, ...newRoles])];
            } else {
                const newMember = {
                    name: selectedMember.value,
                    roles: selectedRoles.map((role) => role.value),
                };
                setFormProject((prevFormProject) => ({
                    ...prevFormProject,
                    project_member: [...prevFormProject.project_member, newMember],
                }));
            }

            setSelectedMember(null);
            setSelectedRoles([]);
        } else {
            setPopupMessage('Please select a member and at least one role.');
            setShowPopup(true);
        }
    };

    const handleDeleteMember = (memberName) => {
        setFormProject((prevFormProject) => ({
            ...prevFormProject,
            project_member: prevFormProject.project_member.filter(
                (member) => member.name !== memberName
            ),
        }));
    };

    const handlePopupClose = () => {
        setShowPopup(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formProject.project_name.trim() || !formProject.start_date || !formProject.end_date) {
            setPopupMessage('Please fill all required fields.');
            setShowPopup(true);
            return;
        }

        const payload = {
            ...formProject,
            start_date: formatDateForInput(formProject.start_date),
            end_date: formatDateForInput(formProject.end_date),
            project_member: JSON.stringify(formProject.project_member),
        };

        axios
            .put(`http://localhost:3001/project/${id}`, payload)
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
        const year = parsedDate.getFullYear();
        const month = String(parsedDate.getMonth() + 1).padStart(2, '0'); // Month is zero-based
        const day = String(parsedDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };


    return (
        <div className="project-page">
            <div className="create-project">
                <button onClick={() => navigate('/Project')} className="back-button">
                    <img src={backarrow} alt="Back arrow" className="backarrow" />
                </button>

                <h2>Update Project</h2>
                <form onSubmit={handleSubmit}>
                    <label>
                        Project Name:
                        <input
                            type="text"
                            name="project_name"
                            value={formProject.project_name}
                            className="project-input"
                            onChange={(e) =>
                                setFormProject({ ...formProject, project_name: e.target.value })
                            }
                        />
                    </label>
                    <label>
                        Project Description:
                        <textarea
                            name="project_description"
                            value={formProject.project_description}
                            className="project-textarea"
                            onChange={(e) =>
                                setFormProject({
                                    ...formProject,
                                    project_description: e.target.value,
                                })
                            }
                            rows="5"
                        />
                    </label>

                    <div className="date-inputs">
                        <label>
                            Start Date:
                            <input
                                type="date"
                                name="start_date"
                                value={formProject.start_date}
                                className="project-input"
                                onChange={(e) =>
                                    setFormProject({ ...formProject, start_date: e.target.value })
                                }
                            />
                        </label>
                        <label>
                            End Date:
                            <input
                                type="date"
                                name="end_date"
                                value={formProject.end_date}
                                className="project-input"
                                onChange={(e) =>
                                    setFormProject({ ...formProject, end_date: e.target.value })
                                }
                            />
                        </label>
                    </div>


                    <p className="invite-topic">Invite Team Member</p>
                    <label>Select Member:</label>
                    <Select
                        placeholder="Select Member"
                        options={members}
                        className="select-mem"
                        onChange={handleMemberChange}
                        value={selectedMember}
                    />

                    <div className="invite">
                        <label>Select Roles:</label>
                        <div className="select-container">
                            <Select
                                isMulti
                                options={[
                                    { value: 'Product Owner', label: 'Product Owner' },
                                    { value: 'Designer', label: 'Designer' },
                                    { value: 'Tester', label: 'Tester' },
                                    { value: 'Developer', label: 'Developer' },
                                ]}
                                className="select-roles"
                                value={selectedRoles}
                                onChange={handleRoleChange}
                                placeholder="Select Roles"
                            />
                            <button className="addmember-button" onClick={handleAddMember}>
                                Add Member
                            </button>
                        </div>
                    </div>

                    <button className="createproject-button" type="submit">
                        Update Project
                    </button>
                </form>
            </div>

            <div className="team-members">
                <h2>Team Members</h2>
                <div className="team-members-list">
                    {formProject.project_member.map((member, index) => (
                        <div key={index} className="team-member">
                            <span>{member.name}</span>
                            <span>Roles: {member.roles ? member.roles.join(', ') : ''}</span>
                            <button
                                className="delete-button"
                                onClick={() => handleDeleteMember(member.name)}
                            >
                                <img src={closeicon} alt="Close Icon" className="closeicon" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UpdateProject;
