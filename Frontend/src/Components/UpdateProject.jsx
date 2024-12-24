import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select';
import './CSS/UpdateProject.css';

const UpdateProject = () => {
    const { id } = useParams();
    const [members, setMembers] = useState([]);
    const [formEditProject, setFormEditProject] = useState({
        project_name: '',
        project_description: '',
        project_member: [],
        start_date: '',
        end_date: '',
        project_status: '', // เพิ่มฟิลด์ project_status เพื่อความถูกต้อง
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // ดึงข้อมูล Project โดยใช้ useEffect
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
                    project_status: projectData.project_status || '', // เพิ่มการตั้งค่า status
                });
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching project data:', err);
                setLoading(false);
            });
    }, [id]);

    // ดึงข้อมูล Members
    useEffect(() => {
        axios
            .get('http://localhost:3001/member')
            .then((res) => {
                const memberOptions = res.data.map((member) => ({
                    value: member.member_name,
                    label: `${member.member_name} (${member.member_role})`,
                }));
                setMembers(memberOptions);
            })
            .catch((err) => console.error('Error fetching members:', err));
    }, []);

    // ฟังก์ชันจัดการการเลือกสมาชิก
    const handleChange = (selectedOptions) => {
        setFormEditProject({
            ...formEditProject,
            project_member: selectedOptions ? selectedOptions.map((option) => option.value) : [],
        });
    };

    // ฟังก์ชันจัดการฟอร์มเมื่อกด Submit
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formEditProject.project_name.trim() || !formEditProject.start_date || !formEditProject.end_date) {
            alert('Please fill in all required fields');
            return;
        }

        axios
            .put(`http://localhost:3001/project/${id}`, {
                ...formEditProject,
                project_member: JSON.stringify(formEditProject.project_member),
            })
            .then(() => {
                alert('Project updated successfully!');
                navigate('/Project');
            })
            .catch((err) => {
                console.error('Error updating project:', err);
                alert('Failed to update project');
            });
    };

    // ฟังก์ชันแปลงวันที่ให้อยู่ในรูปแบบที่ Input รองรับ
    const formatDateForInput = (date) => {
        if (!date) return '';
        const parsedDate = new Date(date);
        return isNaN(parsedDate) ? '' : parsedDate.toISOString().split('T')[0];
    };

    if (loading) {
        return <div>Loading...</div>; // ลูกเล่น Loading
    }

    return (
        <div className="update-project">
            <h2>Update Project</h2>
            <form onSubmit={handleSubmit}>
                <label>
                    Project Name:
                    <input
                        type="text"
                        name="project_name"
                        value={formEditProject.project_name}
                        onChange={(e) =>
                            setFormEditProject({ ...formEditProject, project_name: e.target.value })
                        }
                    />
                </label>
                <label>
                    Project Description:
                    <input
                        type="text"
                        name="project_description"
                        value={formEditProject.project_description}
                        onChange={(e) =>
                            setFormEditProject({ ...formEditProject, project_description: e.target.value })
                        }
                    />
                </label>
                <label>
                    Start Date:
                    <input
                        type="date"
                        name="start_date"
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
                        name="end_date"
                        value={formatDateForInput(formEditProject.end_date)}
                        onChange={(e) =>
                            setFormEditProject({ ...formEditProject, end_date: e.target.value })
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
                        formEditProject.project_member.includes(member.value)
                    )}
                />
                <label>Select Status:</label>
                <select
                    id="requirementStatus"
                    className="select-status"
                    value={formEditProject.project_status || "Select Status"} // ตั้งค่า default
                    onChange={(e) =>
                        setFormEditProject({
                            ...formEditProject,
                            project_status: e.target.value,
                        })
                    }
                >
                    <option value="Select Status" disabled>
                        Select Status
                    </option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="IN PROGRESS">IN PROGRESS</option>
                    <option value="CLOSED">CLOSED</option>
                </select>

                <button type="submit">Update Project</button>
            </form>
        </div>
    );
};

export default UpdateProject;
