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
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        axios
            .get(`http://localhost:3001/project/${id}`) // ดึงข้อมูล Project ให้ขึ้นที่หน้า Update
            .then((res) => {
                const projectData = res.data;
                setFormEditProject({
                    project_name: projectData.project_name,
                    project_description: projectData.project_description,
                    project_member: JSON.parse(projectData.project_member) || [],
                    start_date: projectData.start_date || '',
                    end_date: projectData.end_date || '',
                });
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
                    label: `${member.member_name} (${member.member_role})`,
                }));
                setMembers(memberOptions);
            })
            .catch((err) => console.error('Error fetching members:', err));
    }, []);

    const handleChange = (selectedOptions) => {
        setFormEditProject({
            ...formEditProject,
            project_member: selectedOptions ? selectedOptions.map((option) => option.value) : [],
        });
    };

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
                navigate('/Project'); // เผื่อมีเปลี่ยน path อยู่ตรงนี้เด้อ
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

    const formatDateForDisplay = (date) => { // เงื่อนไขจัดเรียงวันที่ update ให้เป็น วัน/เดือน/ปี
        if (!date) return '';
        const parsedDate = new Date(date);
        if (isNaN(parsedDate)) return '';
        const day = parsedDate.getDate().toString().padStart(2, '0');
        const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
        const year = parsedDate.getFullYear();
        return `${day}/${month}/${year}`;
    };
    

    if (loading) {
        return <div>Loading...</div>; //อันนี้ลูกเล่นเฉยๆไม่ต้องเสือก.......หยอกๆ
    } 

    return ( // ผลลัพท์หน้าบ้าน มีไรแก้ตรงนี้
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
                <button type="submit">Update Project</button>
            </form>
        </div>
    );
};

export default UpdateProject;
