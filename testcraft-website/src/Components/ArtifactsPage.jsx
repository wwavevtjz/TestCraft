import React, { useState } from 'react';
import './ArtifactsPage.css'; // สำหรับการจัดการ CSS

const ArtifactsPage = () => {
  const [artifacts, setArtifacts] = useState([]);
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  const handleUpload = () => {
    if (file && description) {
      const newArtifact = {
        name: file.name,
        description: description,
      };
      setArtifacts([...artifacts, newArtifact]);
      setFile(null);
      setDescription('');
    } else {
      alert('Please select a file and enter a description');
    }
  };

  return (
    <div className="artifacts-page">
      <h1>Upload Artifacts & View List</h1>

      {/* ส่วนสำหรับอัปโหลด Artifact */}
      <div className="upload-section">
        <input type="file" onChange={handleFileChange} />
        <input
          type="text"
          placeholder="Enter artifact description"
          value={description}
          onChange={handleDescriptionChange}
        />
        <button onClick={handleUpload}>Upload Artifact</button>
      </div>

      {/* แสดงรายการ Artifacts */}
      <div className="artifacts-list">
        <h2>Artifacts List</h2>
        {artifacts.length > 0 ? (
          <ul>
            {artifacts.map((artifact, index) => (
              <li key={index}>
                <strong>{artifact.name}</strong> - {artifact.description}
              </li>
            ))}
          </ul>
        ) : (
          <p>No artifacts uploaded yet</p>
        )}
      </div>
    </div>
  );
};

export default ArtifactsPage;
