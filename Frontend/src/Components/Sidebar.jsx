import React from 'react';
import './CSS/Sidebar.css';
import { NavLink } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';
import { GiWhiteBook, GiBrain } from 'react-icons/gi';
import { BiRun } from "react-icons/bi";
import { MdAddBox } from "react-icons/md"; // Import icon for Create Project

const Sidebar = () => {
  return (
    <div className="sidebar">
      <h1 className='TestCraft'>TestCraft</h1>
      <ul className='ul-side'>
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
            to="/Project"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <GiWhiteBook className="sidebar-icon" />Project
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/test-plans"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <GiBrain className='sidebar-icon' /> Test Plans
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/requirementPage"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <BiRun className="sidebar-icon" /> Test Runs
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/create-project"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <MdAddBox className="sidebar-icon" /> Create Project
          </NavLink>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
