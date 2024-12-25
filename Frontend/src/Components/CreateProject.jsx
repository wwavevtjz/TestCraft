import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import './CSS/CreateProject.css';
import closeicon from '../image/close.png';

const CreateProject = () => {
    const [members, setMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [selectedRoles, setSelectedRoles] = useState([]); // Changed to array for multiple roles
    const [formProject, setFormProject] = useState({
        project_name: '',
        project_description: '',
        start_date: '',
        end_date: '',
        project_member: [],
        project_status: ''
    });
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('http://localhost:3001/member')
            .then((res) => {
                const memberOptions = res.data.map((member) => ({
                    value: member.member_name,
                    label: `${member.member_name}`,
                }));
                setMembers(memberOptions);
            })
            .catch((err) => console.log('Error fetching members:', err));
    }, []);

    const handleMemberChange = (selectedOption) => {
        setSelectedMember(selectedOption);
    };

    const handleRoleChange = (selectedOptions) => {
        setSelectedRoles(selectedOptions); // Update roles array
    };

    const handleAddMember = (e) => {
        e.preventDefault();

        if (selectedMember && selectedRoles.length > 0) {
            const existingMember = formProject.project_member.find(
                (member) => member.name === selectedMember.value
            );

            if (existingMember) {
                existingMember.roles = existingMember.roles || [];
                const newRoles = selectedRoles.map(role => role.value);
                existingMember.roles = [...new Set([...existingMember.roles, ...newRoles])];
            } else {
                const newMember = {
                    name: selectedMember.value,
                    roles: selectedRoles.map(role => role.value),
                };
                setFormProject((prevFormProject) => ({
                    ...prevFormProject,
                    project_member: [...prevFormProject.project_member, newMember]
                }));
            }

            setSelectedMember(null); // Reset selected member
            setSelectedRoles([]); // Reset selected roles
        } else {
            setPopupMessage('Please select a member and at least one role.');
            setShowPopup(true);
        }
    };

    // ฟังก์ชันสำหรับลบสมาชิกจากทีม
    const handleDeleteMember = (memberName) => {
        setFormProject((prevFormProject) => ({
            ...prevFormProject,
            project_member: prevFormProject.project_member.filter(
                (member) => member.name !== memberName
            )
        }));
    };

    const handlePopupClose = () => {
        setShowPopup(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formProject.project_name.trim() || !formProject.start_date || !formProject.end_date || !formProject.project_status) {
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

        console.log('Payload:', payload);

        axios
            .post('http://localhost:3001/project', payload)
            .then(() => {
                alert('Project created successfully!');
                navigate('/Project');
            })
            .catch((err) => {
                console.error('Error creating project:', err);
                alert('Failed to create project');
            });
    };

    const formatDateForInput = (date) => {
        if (!date) return '';
        const parsedDate = new Date(date);
        return isNaN(parsedDate) ? '' : parsedDate.toISOString().split('T')[0];
    };

    return (
        <div className="project-page">
            <div className="create-project">
                <h2>Create Project</h2>
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
                        <input
                            type="text"
                            name="project_description"
                            value={formProject.project_description}
                            className="project-input"
                            onChange={(e) =>
                                setFormProject({ ...formProject, project_description: e.target.value })
                            }
                        />
                    </label>
                    <div className="date-inputs">
                        <label>
                            Start Date:
                            <input
                                type="date"
                                name="start_date"
                                value={formatDateForInput(formProject.start_date)}
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
                                value={formatDateForInput(formProject.end_date)}
                                className="project-input"
                                onChange={(e) =>
                                    setFormProject({ ...formProject, end_date: e.target.value })
                                }
                            />
                        </label>
                    </div>
                    <label>Select Status:</label>
                    <select
                        id="requirementStatus"
                        className="select-status"
                        value={formProject.project_status}
                        onChange={(e) =>
                            setFormProject({ ...formProject, project_status: e.target.value })
                        }
                    >
                        <option value="" disabled>Select Status</option>
                        <option value="DRAFT">DRAFT</option>
                        <option value="IN PROGRESS">IN PROGRESS</option>
                        <option value="CLOSED">CLOSED</option>
                    </select>

                    <p className='invite-topic'>Invite Team Member</p>
                    <label>Select Member:</label>
                    <Select
                        placeholder='Select Member'
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
                                    { value: "Product Owner", label: "Product Owner" },
                                    { value: "Designer", label: "Designer" },
                                    { value: "Tester", label: "Tester" },
                                    { value: "Developer", label: "Developer" }
                                ]}
                                className="select-roles"
                                value={selectedRoles}
                                onChange={handleRoleChange}
                                placeholder='Select Roles'
                            />
                            <button className="addmember-button" onClick={handleAddMember}>Add Member</button>
                        </div>
                    </div>



                    <button className='createproject-button' type="submit">Create Project</button>
                </form>
            </div>

            {/* Popup ขึ้นหากไม่เลือก role */}
            {showPopup && (
                <div className="popup">
                    <div className="popup-content">
                        <p>{popupMessage}</p>
                        <button onClick={handlePopupClose}>OK</button>
                    </div>
                </div>
            )}

            <div className="team-members">
                <h2>Team Members</h2>
                <div className="team-members-list">
                    {formProject.project_member.map((member, index) => (
                        <div key={index} className="team-member">
                            <span>{member.name}</span>
                            <span>Roles: {member.roles ? member.roles.join(', ') : ''}</span>
                            <button className="delete-button" onClick={() => handleDeleteMember(member.name)}>
                                <img src={closeicon} alt="Close Icon" className="closeicon" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CreateProject;
