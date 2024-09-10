import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './Components/Sidebar';
import Home from './Components/Home';
import Testplan from './Components/Testplans';
import CreateProject from './Components/CreateProject';
import UpdateTestplan from './Components/UpdateTestplan';
import ArtifactsPage from './Components/ArtifactsPage';

const App = () => {
  return (
    <Router>
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <div style={{ marginLeft: '250px', padding: '20px' }}>
          <Routes>
            <Route path="/home" element={<Home />} />
            <Route path="/test-plans" element={<Testplan />} />
            <Route path="/CreateProject" element={<CreateProject />} />
            <Route path="/UpdateTestplan/:id" element={<UpdateTestplan />} />
            <Route path="/artifacts" element={<ArtifactsPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
