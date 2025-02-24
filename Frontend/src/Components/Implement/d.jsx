import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "../Implement/implementPage.css";
import { useLocation } from 'react-router-dom';

const ImplementPage = () => {
  const [repoLink, setRepoLink] = useState('');
  const [fileNames, setFileNames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [selectedDesigns, setSelectedDesigns] = useState([]);
  const [fileDesigns, setFileDesigns] = useState({});
  const [expandedFolders, setExpandedFolders] = useState([]);
  const [savedConfig, setSavedConfig] = useState(null);
  const [repoBranch, setRepoBranch] = useState('');


  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get("project_id");

  useEffect(() => {
    const storedRepoLink = localStorage.getItem("repoLink");
    const storedBranch = localStorage.getItem("repoBranch");

    if (storedRepoLink) setRepoLink(storedRepoLink);
    if (storedBranch) setRepoBranch(storedBranch);

    fetchImplementConfig();
  }, []);

  useEffect(() => {
    const storedFiles = localStorage.getItem("repoFiles");
    if (storedFiles) {
      setFileNames(JSON.parse(storedFiles)); // โหลดไฟล์เก่ามาใช้
    }
  }, []);


  useEffect(() => {
    fetchDesigns();
  }, []);

  const fetchImplementConfig = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/implementConfig/${projectId}`);
      setSavedConfig(response.data);

      if (response.data.githubLink) {
        setRepoLink(response.data.githubLink);
        localStorage.setItem("repoLink", response.data.githubLink);
      }
      if (response.data.githubBranch) {
        setRepoBranch(response.data.githubBranch);
        localStorage.setItem("repoBranch", response.data.githubBranch);
      }
    } catch (error) {
      console.error("Error fetching implement config:", error);
    }
  };

  const fetchFilesFromRepo = async () => {
    if (!repoLink) return;

    const repoName = repoLink.replace('https://github.com/', '').replace('.git', '');
    const apiUrl = `https://api.github.com/repos/${repoName}/contents`;

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

          // 🔹 บันทึกลง localStorage
          localStorage.setItem("repoFiles", JSON.stringify(fileTree));
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };


  const fetchDesigns = async () => {
    try {
      const response = await axios.get("http://localhost:3001/design", {
        params: { project_id: projectId },
      });
      console.log("Designs from API: ", response.data); // ดูค่าที่ได้รับจาก API
      const baselineDesigns = response.data.filter(design => design.design_status === 'BASELINE');
      setDesigns(baselineDesigns);
    } catch (error) {
      console.error("Error fetching designs:", error);
    }
  };


  const buildFileTree = async (repoName, items, parentPath = '') => {
    const tree = [];

    for (const item of items) {
      if (item.type === 'file' && isSourceCodeFile(item.name)) {
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
      return Array.isArray(data) ? await buildFileTree(repoName, data, folderPath) : [];
    } catch (error) {
      console.error('Error fetching folder contents:', error);
      return [];
    }
  };

  const isSourceCodeFile = (fileName) => {
    const allowedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.html', '.css'];
    return allowedExtensions.some(ext => fileName.endsWith(ext));
  };

  const isIgnoredFolder = (folderName) => {
    const ignoredFolders = ['node_modules', '.git', '.github', 'dist', 'build', '__pycache__'];
    return ignoredFolders.includes(folderName);
  };

  const toggleFolder = (folderPath) => {
    setExpandedFolders((prev) => {
      if (prev.includes(folderPath)) {
        return prev.filter((path) => path !== folderPath);
      } else {
        return [...prev, folderPath];
      }
    });
  };

  const handleRepoLinkChange = (event) => {
    const value = event.target.value;
    setRepoLink(value);
    localStorage.setItem("repoLink", value);
  };

  const handleBranchChange = (event) => {
    const value = event.target.value;
    setRepoBranch(value);
    localStorage.setItem("repoBranch", value);
  };


  const handleFileSelection = (filePath) => {
    setSelectedFiles((prevSelected) => {
      const updatedSelectedFiles = prevSelected.includes(filePath)
        ? prevSelected.filter((path) => path !== filePath)
        : [...prevSelected, filePath];

      localStorage.setItem('selectedFiles', JSON.stringify(updatedSelectedFiles));
      return updatedSelectedFiles;
    });
  };

  const handleDesignSelection = (designId) => {
    setFileDesigns((prevFileDesigns) => {
      const updatedFileDesigns = { ...prevFileDesigns };
      if (!updatedFileDesigns[designId]) {
        updatedFileDesigns[designId] = true;  // Mark as selected
      } else {
        delete updatedFileDesigns[designId];  // Remove if already selected
      }

      console.log("Updated fileDesigns: ", updatedFileDesigns); // ดูค่าของ fileDesigns
      return updatedFileDesigns;
    });
  };




  const handleSave = async () => {
    if (!projectId || selectedFiles.length === 0 || Object.keys(fileDesigns).length === 0) {
      console.error("Required data is missing or invalid");
      return;
    }
  
    // ดึง selected_designs จาก fileDesigns โดยที่แต่ละไฟล์จะมีหลาย design ที่เกี่ยวข้อง
    const selectedDesigns = Object.values(fileDesigns).flat();
    console.log("Selected designs before filtering: ", selectedDesigns);
  
    // กรองค่าที่เป็น null หรือ undefined
    const validDesigns = selectedDesigns.filter(designId => designId != null);
    console.log("Valid designs after filtering: ", validDesigns);
  
    if (validDesigns.length === 0) {
      console.error("No valid designs selected");
      return; // ถ้าไม่มีการเลือกการออกแบบที่ถูกต้อง
    }
  
    // ส่งข้อมูลที่ไม่ซ้ำกัน
    const uniqueDesigns = [...new Set(validDesigns)];
  
    try {
      const response = await axios.post("http://localhost:3001/implementrelation", {
        project_id: projectId,
        selected_files: selectedFiles,
        selected_designs: uniqueDesigns,
      });
      console.log("Data saved successfully:", response);
    } catch (error) {
      console.error("Error details:", error);
    }
  };
  


  return (
    <div className="implement-page">
      <label className="implement-label">
        Link Github Repository:หห
        <input
          type="text"
          value={repoLink}
          disabled
          onChange={handleRepoLinkChange}
          placeholder="e.g., username/repository"
          className="implement-input"
        />
      </label>
      <label className="implement-label">
        Github Branch:
        <input
          type="text"
          value={repoBranch}
          disabled
          onChange={handleBranchChange}
          placeholder="e.g., main"
          className="implement-input"
        />
      </label>
      <button onClick={fetchFilesFromRepo} disabled={loading} className="implement-fetch-btn">
        {loading ? 'Loading...' : 'Fetch Files'}
      </button>

      <div className="implement-main-container">
        <div className="implement-left-column">
          <div className="implement-files-section">
            <h3 className="implement-section-title">Select Files from Repo:</h3>
            {fileNames.length > 0 ? (
              <FileTree files={fileNames} onSelect={handleFileSelection} expandedFolders={expandedFolders} toggleFolder={toggleFolder} />
            ) : (
              <p className="implement-no-files">No files found</p>
            )}
          </div>
        </div>

        <div className="implement-right-column">
          <div className="implement-designs-section">
            <h3 className="implement-section-title">Selected Designs:</h3>
            {designs.length > 0 ? (
              <ul className="implement-design-list">
                {designs.map((design, index) => (
                  <li key={index} className="implement-design-item">
                    <input
                      type="checkbox"
                      className="implement-checkbox"
                      onChange={() => handleDesignSelection(design.id)} // ตรวจสอบว่า design.id ไม่เป็น null
                    />
                    SD-{design.design_id} -  {design.diagram_name} - {design.design_type} - {design.design_description}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="implement-no-designs">No designs found</p>
            )}
          </div>
        </div>
      </div>

      <div className="implement-save-btn-wrapper">
        <button onClick={handleSave} className="implement-save-btn">
          Save
        </button>
      </div>
    </div>
  );
};

const FileTree = ({ files, onSelect, expandedFolders, toggleFolder, parentPath = "" }) => {
  return (
    <ul className="implement-file-tree">
      {files.map((item) => {
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
                  />
                ) : null}
              </>
            ) : (
              expandedFolders.includes(parentPath) && (
                <>
                  <input
                    type="checkbox"
                    onChange={() => onSelect(fullPath)}
                    className="implement-checkbox"
                  />
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

export default ImplementPage;
