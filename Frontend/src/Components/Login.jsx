import React, { useState } from 'react';
import './CSS/Login.css';
import logo from '../image/testcraft-logo.png';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const Login = ({ setUsername }) => { // รับ setUsername จาก props
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const navigate = useNavigate();

    const handleChange = ({ target: { name, value } }) => {
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.username || !formData.password) {
            toast.warning('Please fill in all required fields.');
            return;
        }

        try {
            const response = await fetch('http://localhost:3001/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_name: formData.username,
                    user_password: formData.password,
                }),
            });

            if (response.ok) {
                toast.success(`User ${formData.username} Login Success`);
                localStorage.setItem('username', formData.username); // บันทึก username ลงใน Local Storage
                navigate('/Home');
            } else {
                toast.error('Username or password is incorrect.');
            }
        } catch (error) {
            toast.error('Something went wrong. Please try again later.');
        }
    };


    return (
        <div className="login-page">
            <div className="login-left">
                <img src={logo} alt="TestCraft Logo" className="promo-image" />
            </div>
            <div className="login-right">
                <form className="login-form" onSubmit={handleSubmit}>
                    <h1 className='welcome-topic'>Welcome to TestCraft</h1>
                    <p>
                        Don't have an account yet? <a href="/Signup">Sign Up</a>
                    </p>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange} // ใช้ handleChange ที่เพิ่มมา
                            placeholder="Enter your username"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange} // ใช้ handleChange ที่เพิ่มมา
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    <button type="submit" className="login-button">
                        Login
                    </button>
                </form>
            </div>

            {/* เพิ่มการตั้งค่าตำแหน่งของ ToastContainer */}
            <ToastContainer />
        </div>
    );
};

export default Login;
