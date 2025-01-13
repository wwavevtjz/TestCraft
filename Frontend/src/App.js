import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import CreateProject from './Components/CreateProject';
import CreateRequirement from './Components/CreateRequirement';
import RequirementPage from './Components/RequirementPage';
import ViewEditReq from './Components/ViewEditReq';
import UpdateRequirement from './Components/UpdateRequirement';
import ReqVerification from './Components/ReqVerification';
import VerificationHis from './Components/VerificationHis';
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
import ViewFile from './Components/ViewFile';
import 'bootstrap/dist/css/bootstrap.min.css'; // Make sure Bootstrap CSS is imported



// Notify
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  const [username, setUsername] = useState(null); // State เก็บชื่อผู้ใช้ที่ล็อกอิน
  const location = useLocation();

  // ตรวจสอบเส้นทางปัจจุบัน
  const shouldShowNavbar = !['/', '/Signup'].includes(location.pathname);

  return (
    <>
      {/* แสดง Navbar และส่ง username ไปแสดง */}
      {shouldShowNavbar && <Navbar username={username} />}

      {/* วาง ToastContainer นอก Routes */}
      <ToastContainer position="top-center" />
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
        <Route path="/ViewEditReq" element={<ViewEditReq />} />
        <Route path="/CreateRequirement" element={<CreateRequirement />} />
        <Route path="/UpdateRequirement" element={<UpdateRequirement />} />
        <Route path="/ReqVerification" element={<ReqVerification />} />
        <Route path="/ViewFile" element={<ViewFile />} />
        <Route path="/VerificationHis" element={<VerificationHis />} />

        {/* Routes สำหรับ Login */}
        <Route path="/" element={<Login setUsername={setUsername} />} />
        <Route path="/Signup" element={<Signup />} />

        {/* ไฟล์ทดลอง */}
        <Route path="/TryToReq" element={<TryToReq />} />
        <Route path="/Uploadfile" element={<Uploadfile />} />
      </Routes>
    </>
  );
};

const WrappedApp = () => (
  <Router>
    <App />
  </Router>
);

export default WrappedApp;
