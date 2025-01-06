import React from 'react';
import './CSS/Navbar.css';
import { Link } from 'react-router-dom';
import logo from '../image/testcraft-logo.png'; // ตรวจสอบเส้นทางให้ถูกต้อง
import DropdownMenu from './DropdownMenu';


function Navbar() {
    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/">
                    <img src={logo} alt="TestCraft Logo" className="logo" />
                </Link>
            </div>
            <div className='flex sm:justify-between'>
                <DropdownMenu />
            </div>
        </nav>
    );
}

export default Navbar;
