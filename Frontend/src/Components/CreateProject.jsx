import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import './CSS/CreateProject.css';

const CreateProject = () => {
    const [members, setMembers] = useState([]);
    const [formProject, setFormProject] = useState({
        project_name: '',
        project_description: '',
        start_date: '',
        end_date: '',
        project_member: [],
    });
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('http://localhost:3001/member')
            .then((res) => {
                const memberOptions = res.data.map((member) => ({
                    value: member.member_name,
                    label: `${member.member_name} (${member.member_role})`,
                }));
                setMembers(memberOptions);
            })
            .catch((err) => console.log('Error fetching members:', err));
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    const handleChange = (selectedOptions) => {
        setFormProject({
            ...formProject,
            project_member: selectedOptions ? selectedOptions.map((option) => option.value) : [],
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formProject.project_name.trim() || !formProject.start_date || !formProject.end_date) {
            alert('Please fill in all required fields.');
            return;
        }

        const payload = {
            ...formProject,
            start_date: formatDate(formProject.start_date),
            end_date: formatDate(formProject.end_date),
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

    return (
        <div className="create-project">
            <h2>Create New Project</h2>
            <form onSubmit={handleSubmit}>
                <label>
                    Project Name:
                    <input
                        type="text"
                        name="project_name"
                        value={formProject.project_name}
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
                        onChange={(e) =>
                            setFormProject({ ...formProject, project_description: e.target.value })
                        }
                    />
                </label>
                <label>
                    Start Date:
                    <input
                        type="date"
                        name="start_date"
                        value={formProject.start_date}
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
                        onChange={(e) =>
                            setFormProject({ ...formProject, end_date: e.target.value })
                        }
                    />
                </label>
                <label>Select Members:</label>
                <Select
                    isMulti
                    name="project_member"
                    options={members}
                    className="select-members"
                    classNamePrefix="select"
                    onChange={handleChange}
                    value={members.filter((member) =>
                        formProject.project_member.includes(member.value)
                    )}
                />
                <button type="submit">Create Project</button>
            </form>
        </div>
    );
};

export default CreateProject;
