import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import CreateProject from './Components/CreateProject';
import CreateRequirement from './Components/CreateRequirement';
import RequirementPage from './Components/RequirementPage';
import UpdateRequirement from './Components/UpdateRequirement';
import ReqVerification from './Components/ReqVerification';
import Project from './Components/Project';
import Navbar from './Components/Navbar';
import Dashboard from './Components/Dashboard';
import UpdateProject from './Components/UpdateProject';
import Home from './Components/Home';
import TryToReq from './Components/TryToReq';

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Route for Project listing */}
        <Route path="/" element={<Home />} />

        {/* Routes for Project management */}
        <Route path="/Project" element={<Project />} />
        <Route path="/CreateProject" element={<CreateProject />} />
        <Route path="/UpdateProject/:id" element={<UpdateProject />} />

        {/* Route for Dashboard */}
        <Route path="/Dashboard" element={<Dashboard />} />

        {/* Routes for Requirements */}
        <Route path="/requirementPage" element={<RequirementPage />} />
        <Route path="/CreateRequirement" element={<CreateRequirement />} />
        <Route path="/UpdateRequirement" element={<UpdateRequirement />} />
        <Route path="/ReqVerification" element={<ReqVerification />} />

        <Route path="/TryToReq" element={<TryToReq />} />
      </Routes>
    </Router>
  );
};

export default App;
