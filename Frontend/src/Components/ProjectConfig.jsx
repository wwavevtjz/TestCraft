import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import './CSS/ProjectConfig.css';
import { useLocation } from "react-router-dom";
import fetchfile from "../Components/Implement/image/fetch-file.png";
const FileTree = ({ files, onSelect, expandedFolders, toggleFolder, parentPath = "", filterText }) => {
    return (
        <ul className="implement-file-tree">
            {files
                .map((item) => {
                    const fullPath = parentPath ? `${parentPath}/${item.name}` : item.name;

                    return (
                        <li key={fullPath} className="implement-file-item">
                            {item.type === "folder" ? (
                                <>
                                    <span
                                        className="implement-folder-label"
                                        onClick={() => toggleFolder(fullPath)}
                                        aria-expanded={expandedFolders.includes(fullPath)}
                                    >
                                        {expandedFolders.includes(fullPath) ? "📂" : "📁"} {item.name}
                                    </span>

                                    {expandedFolders.includes(fullPath) && item.children ? (
                                        <FileTree
                                            files={item.children}
                                            onSelect={onSelect}
                                            expandedFolders={expandedFolders}
                                            toggleFolder={toggleFolder}
                                            parentPath={fullPath}
                                            filterText={filterText} // ส่ง filterText ไปที่ child
                                        />
                                    ) : null}
                                </>
                            ) : (
                                expandedFolders.includes(parentPath) && (
                                    <>
                                        📄 {item.name}
                                    </>
                                )
                            )}
                        </li>
                    );
                })}
        </ul>
    );
};

const ProjectConfig = () => {
    const [newReqCriteria, setNewReqCriteria] = useState("");
    const [reqcriList, setReqcriList] = useState([]);
    const [loadingReq, setLoadingReq] = useState(true);
    const [newDesignCriteria, setNewDesignCriteria] = useState("");
    const [designCriList, setDesignCriList] = useState([]);
    const [loadingDesign, setLoadingDesign] = useState(true);
    const [newTestcaseCriteria, setNewTestcaseCriteria] = useState("");
    const [testcaseCriList, setTestcaseCriList] = useState([]);
    const [loadingTestcase, setLoadingTestcase] = useState(true);

    const [repoLink, setRepoLink] = useState('');
    const [fileNames, setFileNames] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState([]);
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [filterText, setFilterText] = useState('');
    const [projectId, setProjectId] = useState(null);
    const location = useLocation();
    const [implementConfig, setImplementConfig] = useState(null);
    const [configId, setConfigId] = useState(null);
    const queryParams = new URLSearchParams(window.location.search);
    const id = queryParams.get("id");
    const [isSaved, setIsSaved] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const filterFiles = (files, query) => {
        if (!query) return files;

        return files
            .map(file => {
                if (file.type === "folder") {
                    // ค้นหาไฟล์ที่อยู่ภายในโฟลเดอร์
                    const filteredChildren = filterFiles(file.children || [], query);

                    // ถ้าโฟลเดอร์ชื่อที่ค้นหาหรือมีไฟล์ข้างในที่ตรง ให้แสดงโฟลเดอร์
                    if (file.name.toLowerCase().includes(query.toLowerCase()) || filteredChildren.length > 0) {
                        return { ...file, children: filteredChildren };
                    }
                    return null;
                }

                // ตรวจสอบชื่อไฟล์โดยตรง
                return file.name.toLowerCase().includes(query.toLowerCase()) ? file : null;
            })
            .filter(Boolean); // กรองค่าที่เป็น null ออก
    };

    const filteredFiles = filterFiles(fileNames, searchTerm);


    const navigate = useNavigate();
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const id = queryParams.get('project_id');
        if (id) {
            setProjectId(id); // ตั้งค่า projectId
        }
    }, [location]);

    useEffect(() => {
        fetchReqCriteria();
        fetchDesignCriteria();
        fetchTestcaseCriteria();
    }, []);

    useEffect(() => {
        if (repoLink) {
            fetchBranchesFromRepo();
        }
    }, [repoLink]);

    const fetchImplementConfig = async (projectId) => {
        try {
            const response = await axios.get(`http://localhost:3001/implementConfig/${projectId}`);
            if (response.data) {
                setImplementConfig(response.data);
                setConfigId(response.data.id); // กำหนดค่า configId ให้ถูกต้อง
                setRepoLink(response.data.githubLink);
                setSelectedBranch(response.data.githubBranch);
            }
        } catch (error) {
            console.error("Error fetching implement config:", error);
        }
    };


    useEffect(() => {
        if (implementConfig) {
            setRepoLink(implementConfig.githubLink);  // อัพเดตเมื่อข้อมูลมีการเปลี่ยนแปลง
            setSelectedBranch(implementConfig.githubBranch);
        }
    }, [implementConfig]);

    useEffect(() => {
        if (projectId) {
            console.log("Fetching implement config for projectId:", projectId); // เพิ่มการตรวจสอบ
            fetchImplementConfig(projectId);
        }
    }, [projectId]);  // ดูว่าการเปลี่ยนแปลง projectId ทำงานหรือไม่



    const fetchBranchesFromRepo = async () => {
        if (!repoLink) return;

        const repoName = repoLink.replace('https://github.com/', '').replace('.git', '');
        const apiUrl = `https://api.github.com/repos/${repoName}/branches`;

        try {
            const response = await fetch(apiUrl, {
                headers: { 'Authorization': `token ${''}` },
            });

            if (response.ok) {
                const data = await response.json();
                setBranches(data);
            }
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const handleRepoLinkChange = (event) => {
        setRepoLink(event.target.value);
    };

    const toggleFolder = (folderPath) => {
        setExpandedFolders((prev) => {
            if (prev.includes(folderPath)) {
                return prev.filter((path) => path !== folderPath); // ปิดโฟลเดอร์ที่ถูกกดซ้ำ
            } else {
                return [...prev, folderPath]; // เปิดโฟลเดอร์ที่ถูกกด
            }
        });
    };

    const isSourceCodeFile = (fileName) => {
        const allowedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.html', '.css'];
        return allowedExtensions.some(ext => fileName.endsWith(ext));
    };

    const isIgnoredFolder = (folderName) => {
        const ignoredFolders = ['node_modules', '.git', '.github', 'dist', 'build', '__pycache__'];
        return ignoredFolders.includes(folderName);
    };

    const isIgnoredFile = (fileName) => {
        const ignoredFiles = ['package.json', 'package-lock.json', 'yarn.lock', '.gitignore', 'README.md'];
        return ignoredFiles.includes(fileName);
    };

    const fetchFilesFromRepo = async () => {
        if (!repoLink || !selectedBranch) return; // Ensure branch is selected

        const repoName = repoLink.replace('https://github.com/', '').replace('.git', '');
        const apiUrl = `https://api.github.com/repos/${repoName}/contents?ref=${selectedBranch}`; // Add `ref` to specify branch

        try {
            setLoading(true);
            const response = await fetch(apiUrl, {
                headers: { 'Authorization': `token ${''}` },
            });

            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    const fileTree = await buildFileTree(repoName, data);
                    setFileNames(fileTree);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };


    const buildFileTree = async (repoName, items, parentPath = '') => {
        const tree = [];

        for (const item of items) {
            if (item.type === 'file' && isSourceCodeFile(item.name) && !isIgnoredFile(item.name)) {
                tree.push({ name: item.name, type: 'file', path: item.path });
            } else if (item.type === 'dir' && !isIgnoredFolder(item.name)) {
                const folderContents = await fetchFolderContents(repoName, item.path);
                tree.push({ name: item.name, type: 'folder', children: folderContents });
            }
        }

        return tree;
    };

    const fetchFolderContents = async (repoName, folderPath) => {
        const folderApiUrl = `https://api.github.com/repos/${repoName}/contents/${folderPath}`;

        try {
            const response = await fetch(folderApiUrl, {
                headers: { 'Authorization': `token ${''}` },
            });

            const data = await response.json();
            if (Array.isArray(data)) {
                return await buildFileTree(repoName, data, folderPath);
            }
            return [];
        } catch (error) {
            console.error('Error fetching folder contents:', error);
            return [];
        }
    };

    // Fetch Requirement Criteria List
    const fetchReqCriteria = async () => {
        try {
            setLoadingReq(true);
            const response = await axios.get("http://localhost:3001/reqcriteria");
            setReqcriList(response.data);
        } catch (error) {
            console.error("Error fetching requirement criteria:", error);
        } finally {
            setLoadingReq(false);
        }
    };

    // Fetch Design Criteria List
    const fetchDesignCriteria = async () => {
        try {
            setLoadingDesign(true);
            const response = await axios.get("http://localhost:3001/designcriteria");
            setDesignCriList(response.data);
        } catch (error) {
            console.error("Error fetching design criteria:", error);
        } finally {
            setLoadingDesign(false);
        }
    };

    // Fetch Testcase Criteria List
    const fetchTestcaseCriteria = async () => {
        try {
            setLoadingTestcase(true);
            const response = await axios.get("http://localhost:3001/testcasecriteria");
            setTestcaseCriList(response.data);
        } catch (error) {
            console.error("Error fetching testcase criteria:", error);
        } finally {
            setLoadingTestcase(false);
        }
    };

    // Add New Requirement Criteria
    const handleAddReqCriteria = async () => {
        if (newReqCriteria.trim() === "") {
            alert("กรุณากรอกชื่อ Requirement Criteria ก่อน");
            return;
        }
        try {
            await axios.post("http://localhost:3001/reqcriteria", { reqcri_name: newReqCriteria });
            setNewReqCriteria("");
            fetchReqCriteria();
        } catch (error) {
            console.error("Error adding requirement criteria:", error);
        }
    };

    // Add New Design Criteria
    const handleAddDesignCriteria = async () => {
        if (newDesignCriteria.trim() === "") {
            alert("กรุณากรอกชื่อ Design Criteria ก่อน");
            return;
        }
        try {
            await axios.post("http://localhost:3001/designcriteria", { design_cri_name: newDesignCriteria });
            setNewDesignCriteria("");
            fetchDesignCriteria();
        } catch (error) {
            console.error("Error adding design criteria:", error);
        }
    };

    // Add New Testcase Criteria
    const handleAddTestcaseCriteria = async () => {
        if (newTestcaseCriteria.trim() === "") {
            alert("กรุณากรอกชื่อ Testcase Criteria ก่อน");
            return;
        }
        try {
            await axios.post("http://localhost:3001/testcasecriteria", { testcasecri_name: newTestcaseCriteria });
            setNewTestcaseCriteria("");
            fetchTestcaseCriteria();
        } catch (error) {
            console.error("Error adding testcase criteria:", error);
        }
    };

    // Delete Criteria
    const handleDelete = async (id, type) => {
        if (!window.confirm("คุณแน่ใจหรือว่าต้องการลบ Criteria นี้?")) return;
        try {
            let endpoint = "";
            if (type === "requirement") endpoint = `http://localhost:3001/reqcriteria/${id}`;
            else if (type === "design") endpoint = `http://localhost:3001/designcriteria/${id}`;
            else if (type === "testcase") endpoint = `http://localhost:3001/testcasecriteria/${id}`;

            await axios.delete(endpoint);

            if (type === "requirement") fetchReqCriteria();
            else if (type === "design") fetchDesignCriteria();
            else if (type === "testcase") fetchTestcaseCriteria();
        } catch (error) {
            console.error("Error deleting criteria:", error);
        }
    };

    const handleUpdateImplementConfig = async () => {
        if (!configId) {
            alert("Config ID ไม่ถูกต้อง");
            return;
        }

        try {
            const response = await axios.put(`http://localhost:3001/implementConfig/${configId}`, {
                githubLink: repoLink,
                githubBranch: selectedBranch,
                projectId: projectId  // ต้องส่ง projectId ไปด้วย
            });

            if (response.status === 200) {
                alert("อัปเดตข้อมูลสำเร็จ");
                fetchImplementConfig(projectId);  // รีเฟรชข้อมูลหลังอัปเดต
                setIsSaved(true);
            } else {
                alert("ไม่สามารถอัปเดตข้อมูลได้");
            }
        } catch (error) {
            console.error("Error updating implement config:", error);
            alert("ไม่สามารถอัปเดตข้อมูลได้");
        }
    };



    const handleSaveImplementConfig = async () => {
        if (!repoLink || !selectedBranch || !projectId) {
            alert("กรุณากรอก Github Link, เลือก Branch และกรอก Project ID");
            return;
        }

        try {
            const response = await axios.post("http://localhost:3001/implementConfig", {
                githubLink: repoLink,
                githubBranch: selectedBranch,
                projectId: projectId
            });

            if (response.status === 201) {
                alert("บันทึกข้อมูลสำเร็จ");
                fetchImplementConfig(projectId);  // เรียกดึงข้อมูลใหม่หลังจากบันทึก
                setIsSaved(true);  // Set isSaved to true to hide the Save button
            } else {
                alert("ไม่สามารถบันทึกข้อมูลได้");
            }
        } catch (error) {
            console.error("Error saving implement config:", error);
            alert("ไม่สามารถบันทึกข้อมูลได้");
        }
    };




    return (
        <div className="project-config-container">
            <div className="project-config-header">
                <h1>Configuration</h1>
            </div>

            <div className="project-config-content">
                {/* Software Requirement Specification Verification Criteria */}
                <div className="project-config-checklist-section">
                    <h2>Software Requirement Specification Verification Criteria</h2>
                    <div className="project-config-input-container">
                        <input
                            type="text"
                            value={newReqCriteria}
                            onChange={(e) => setNewReqCriteria(e.target.value)}
                            placeholder="Add New Criteria"
                            className="project-config-input"
                        />
                        <button className="project-config-add-button" onClick={handleAddReqCriteria}>
                            Add
                        </button>
                    </div>
                    {loadingReq ? <p>Loading...</p> : (
                        <ul className="project-config-criteria-list">
                            {reqcriList.map((criteria) => (
                                <li key={criteria.reqcri_id} className="project-config-criteria-item">
                                    <span>{criteria.reqcri_name}</span>
                                    <button className="project-config-delete-button" onClick={() => handleDelete(criteria.reqcri_id, "requirement")}>
                                        Delete
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Software Design Verification Criteria */}
                <div className="project-config-checklist-section">
                    <h2>Software Design Verification Criteria</h2>
                    <div className="project-config-input-container">
                        <input
                            type="text"
                            value={newDesignCriteria}
                            onChange={(e) => setNewDesignCriteria(e.target.value)}
                            placeholder="Add New Criteria"
                            className="project-config-input"
                        />
                        <button className="project-config-add-button" onClick={handleAddDesignCriteria}>
                            Add
                        </button>
                    </div>
                    {loadingDesign ? <p>Loading...</p> : (
                        <ul className="project-config-criteria-list">
                            {designCriList.map((criteria) => (
                                <li key={criteria.designcri_id} className="project-config-criteria-item">
                                    <span>{criteria.design_cri_name}</span>
                                    <button className="project-config-delete-button" onClick={() => handleDelete(criteria.designcri_id, "design")}>
                                        Delete
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Testcase Verification Criteria */}
                <div className="project-config-checklist-section">
                    <h2>Testcase Verification Criteria</h2>
                    <div className="project-config-input-container">
                        <input
                            type="text"
                            value={newTestcaseCriteria}
                            onChange={(e) => setNewTestcaseCriteria(e.target.value)}
                            placeholder="Add New Criteria"
                            className="project-config-input"
                        />
                        <button className="project-config-add-button" onClick={handleAddTestcaseCriteria}>
                            Add
                        </button>
                    </div>
                    {loadingTestcase ? <p>Loading...</p> : (
                        <ul className="project-config-criteria-list">
                            {testcaseCriList.map((criteria) => (
                                <li key={criteria.testcasecri_id} className="project-config-criteria-item">
                                    <span>{criteria.testcasecri_name}</span>
                                    <button className="project-config-delete-button" onClick={() => handleDelete(criteria.testcasecri_id, "testcase")}>
                                        Delete
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="project-config-checklist-section">
                    <h2>Implement</h2>
                    <div className="implement-configpage">
                        <label className="implementconfig-label">
                            Link Github Repository:
                            <input
                                type="text"
                                value={repoLink}  // Bind repoLink to input field
                                onChange={handleRepoLinkChange}
                                placeholder="e.g., username/repository"
                                className="implementconfig-input"
                            />
                        </label>
                        <div className="implementconfig-label">Branch:
                            <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
                                <option value="">Select Branch</option>
                                {branches.map((branch) => (
                                    <option key={branch.name} value={branch.name}>
                                        {branch.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="save-update-imple">
                            <button
                                onClick={handleSaveImplementConfig}
                                className="save-implement"
                                style={{ display: configId ? 'none' : 'inline-block' }}
                            >
                                Save
                            </button>

                            <button
                                onClick={handleUpdateImplementConfig}
                                className="update-implement"
                                style={{ display: configId ? 'inline-block' : 'none' }}
                            >
                                Update
                            </button>
                        </div>

                        <div className="implementconfig-label">Filter:
                            <input
                                type="text"
                                placeholder="Search files..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button onClick={fetchFilesFromRepo} disabled={loading} className="implementconfig-fetch-btn">
                            <img src={fetchfile} alt="fetchfile" className="fetchfile" /> {loading ? 'Loading...' : 'Fetch Files'}
                        </button>

                        <div className="implement-main-container">
                            <div className="implement-left-column">
                                <div className="implement-files-section">
                                    <h3 className="implement-section-title">Files from Repository :</h3>
                                    {fileNames.length > 0 ? (
                                        <FileTree files={filteredFiles} expandedFolders={expandedFolders} toggleFolder={toggleFolder} />
                                    ) : (
                                        <p className="implement-no-files">No files found</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ProjectConfig;