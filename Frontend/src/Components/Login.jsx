import React, { useState } from 'react';
import './CSS/Login.css';
import logo from '../image/testcraft-logo.png';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const Login = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const navigate = useNavigate(); // Initialize navigate

    const handleChange = ({ target: { name, value } }) => { // Destructuring for handleChange
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
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_name: formData.username,
                    user_password: formData.password,
                }),
            });

            console.log('Response:', response); // ล็อกการตอบกลับ
            if (response.ok) {
                toast.success(`User ${formData.username} Login Success`);
                navigate('/Home'); // นำทางไปยังหน้า Home หลังจากล็อกอินสำเร็จ
            } else {
                const errorData = await response.json();
                console.error('Error Data:', errorData); // ล็อกข้อมูลข้อผิดพลาดจากเซิร์ฟเวอร์
                toast.error('Username or password is incorrect. Please try again.');
            }
        } catch (error) {
            console.error('Error during login:', error);
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
                    <h1>Welcome to TestCraft</h1>
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
                            onChange={handleChange}
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
                            onChange={handleChange}
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
