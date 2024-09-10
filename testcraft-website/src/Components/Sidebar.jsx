import React from 'react';
import './Sidebar.css';
import { NavLink } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';
import { GiWhiteBook, GiBrain } from 'react-icons/gi';
import { BiRun } from "react-icons/bi";
import { MdFileUpload } from "react-icons/md"; // ไอคอนสำหรับหน้า Artifacts

const Sidebar = () => {
  return (
    <div className="sidebar">
      <h1 className='TestCraft'>TestCraft</h1>
      <ul>
        <li>
          <NavLink
            to="/home"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <FaHome className="sidebar-icon" /> Home
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/test-plans"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <GiBrain className="sidebar-icon" /> Test Plans
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/test-runs"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <BiRun className="sidebar-icon" /> Test Runs
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/all-projects"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <GiWhiteBook className="sidebar-icon" /> Projects
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/artifacts"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <MdFileUpload className="sidebar-icon" /> Artifacts
          </NavLink>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
