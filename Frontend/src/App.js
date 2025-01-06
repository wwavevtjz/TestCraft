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
import Uploadfile from './Components/Uploadfile';
import Login from './Components/Login';
import Signup from './Components/Signup';
import ProjectConfig from './Components/ProjectConfig';



// Notify
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // อย่าลืม import CSS สำหรับ react-toastify

const App = () => {
  return (
    <Router>
      <Navbar />

      {/* วาง ToastContainer นอก Routes */}
      <ToastContainer position='top-center' />
      <Routes>
        {/* Route สำหรับหน้า Home */}
        <Route path="/Home" element={<Home />} />

        {/* Routes สำหรับการจัดการ Project */}
        <Route path="/Project" element={<Project />} />
        <Route path="/CreateProject" element={<CreateProject />} />
        <Route path="/UpdateProject/:id" element={<UpdateProject />} />

        {/* Route สำหรับ Dashboard */}
        <Route path="/Dashboard" element={<Dashboard />} />

        {/* Routes สำหรับการตั้งค่า Project */}
        <Route path="/ProjectConfig" element={<ProjectConfig />} />

        {/* Routes สำหรับ Requirements */}
        <Route path="/requirementPage" element={<RequirementPage />} />
        <Route path="/CreateRequirement" element={<CreateRequirement />} />
        <Route path="/UpdateRequirement" element={<UpdateRequirement />} />
        <Route path="/ReqVerification" element={<ReqVerification />} />

        {/* Routes สำหรับ Login */}
        <Route path="/" element={<Login />} />
        <Route path="/Signup" element={<Signup />} />

        {/* ไฟล์ทดลอง */}
        <Route path="/TryToReq" element={<TryToReq />} />
        <Route path="/Uploadfile" element={<Uploadfile />} />
      </Routes>
    </Router>
  );
};

export default App;
