import React, { useEffect, useState } from 'react';
import './CSS/Navbar.css';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../image/testcraft-logo.png';
import user from "../image/user.png";
import { Dropdown } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';  // เพิ่มการนำเข้า ToastContainer และ toast
import 'react-toastify/dist/ReactToastify.css';  // นำเข้า CSS ของ toastify

function Navbar() {
    const [username, setUsername] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        setUsername(storedUsername);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('username');
        setUsername(null);
        navigate('/');
    };

    const handleLoginRedirect = () => {
        navigate('/'); // ไปที่หน้า login เมื่อคลิกปุ่ม Login
    };

    return (
        <>
            <nav className="navbar">
                <div className="navbar-brand">
                    <Link to="/">
                        <img src={logo} alt="TestCraft Logo" className="logo" />
                    </Link>
                </div>
                <div className="navbar-user">
                    {username ? (
                        <span className="welcome-message">
                            <img src={user} alt="user" className="user" />
                            {username}
                        </span>
                    ) : (
                        <span className="welcome-message">
                            <button onClick={handleLoginRedirect} className="guest-login-button">
                                Login
                            </button>
                        </span>
                    )}

                    {username && (
                        <Dropdown className="navbar-dropdown">
                            <Dropdown.Toggle id="dropdown-custom-components">
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    )}
                </div>
            </nav>
            <ToastContainer />  {/* เพิ่ม ToastContainer ที่นี่ */}
        </>
    );
}

export default Navbar;
