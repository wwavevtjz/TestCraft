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
  const [fileDesigns, setFileDesigns] = useState({}); // เก็บข้อมูลที่จับคู่ไฟล์กับ design_id
  const [expandedFolders, setExpandedFolders] = useState([]);
  
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get("project_id");

  useEffect(() => {
    const savedSelectedFiles = JSON.parse(localStorage.getItem('selectedFiles'));
    const savedSelectedDesigns = JSON.parse(localStorage.getItem('selectedDesigns'));
    if (savedSelectedFiles) {
      setSelectedFiles(savedSelectedFiles);
    }
    if (savedSelectedDesigns) {
      setSelectedDesigns(savedSelectedDesigns);
    }

    fetchDesigns();
  }, []);

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

  const handleFileSelection = (filePath) => {
    setSelectedFiles((prevSelected) => {
      const updatedSelectedFiles = prevSelected.includes(filePath)
        ? prevSelected.filter((path) => path !== filePath)
        : [...prevSelected, filePath];

      localStorage.setItem('selectedFiles', JSON.stringify(updatedSelectedFiles));
      return updatedSelectedFiles;
    });
  };

  const handleDesignSelection = (filePath, designId) => {
    setFileDesigns((prevFileDesigns) => {
      const updatedFileDesigns = { ...prevFileDesigns };
      if (!updatedFileDesigns[filePath]) {
        updatedFileDesigns[filePath] = [];
      }

      if (updatedFileDesigns[filePath].includes(designId)) {
        updatedFileDesigns[filePath] = updatedFileDesigns[filePath].filter(id => id !== designId);
      } else {
        updatedFileDesigns[filePath].push(designId);
      }

      return updatedFileDesigns;
    });
  };


  const fetchDesigns = async () => {
    try {
      const response = await axios.get("http://localhost:3001/design", {
        params: { project_id: projectId },
      });

      const baselineDesigns = response.data.filter(design => design.design_status === 'BASELINE');
      setDesigns(baselineDesigns);
    } catch (error) {
      console.error("Error fetching designs:", error);
    }
  };

  // Function to handle the save action
  const handleSave = async () => {
    try {
      let dataToSend = [];

      Object.keys(fileDesigns).forEach(filePath => {
        if (fileDesigns[filePath].length > 0) {
          const designIds = fileDesigns[filePath]
            .map(id => Number(id)) // แปลงเป็นตัวเลข
            .filter(id => !isNaN(id)); // กรองค่าที่ไม่ใช่ตัวเลขออก

          if (designIds.length > 0) {
            dataToSend.push({
              implement_filename: filePath,
              design_ids: designIds,
            });
          }
        }
      });

      console.log('Data to send:', JSON.stringify(dataToSend, null, 2));

      const response = await axios.post('http://localhost:3001/implementrelation', { data: dataToSend });

      console.log('Response:', response.data);
      alert('Data saved successfully!');

      // ✅ Reset checkbox หลังจากบันทึกสำเร็จ
      setSelectedFiles([]);
      setFileDesigns({});
      setSelectedDesigns([]);
      localStorage.removeItem('selectedFiles'); // ล้างค่าใน localStorage
      localStorage.removeItem('selectedDesigns');

    } catch (error) {
      console.error('Error saving data:', error);
      alert('Failed to save data');
    }
  };

    return (
      <div className="implement-page">
        <label className="implement-label">
          Link Github Repository:
          <input
            type="text"
            value={repoLink}
            onChange={handleRepoLinkChange}
            placeholder="e.g., username/repository"
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
                        onChange={() => {
                          selectedFiles.forEach(filePath => {
                            handleDesignSelection(filePath, design.design_id);
                          });
                        }}
                        className="implement-checkbox"
                      />
                      {design.diagram_name} - {design.design_type} - {design.design_description}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="implement-no-designs">No designs with status 'BASELINE' found</p>
              )}
            </div>
          </div>
        </div>
  
        <div className="implement-save-btn-wrapper">
          <button className="implement-save-btn" onClick={handleSave}>
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
          const fullPath = parentPath ? `${parentPath}/${item.name}` : item.name; // สร้าง path เต็ม
  
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
                      parentPath={fullPath} // ส่ง path เต็มให้กับ children
                    />
                  ) : null}
                </>
              ) : (
                expandedFolders.includes(parentPath) && ( // แสดงไฟล์เฉพาะถ้าโฟลเดอร์แม่ถูกเปิด
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
  