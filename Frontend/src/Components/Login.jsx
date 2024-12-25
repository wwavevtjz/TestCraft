import React, { useState } from 'react';
import './CSS/Login.css';
import logo from '../image/testcraft-logo.png';

const Login = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [showModal, setShowModal] = useState(false); // State to show modal
    const [modalMessage, setModalMessage] = useState(''); // Message to display in modal

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.username || !formData.password) {
            alert('Please fill in all required fields.');
            return;
        }

        try {
            const response = await fetch('http://localhost:3001/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_name: formData.username, // ส่งข้อมูล username
                    user_password: formData.password, // ส่งข้อมูล password
                }),
            });

            if (response.ok) {
                const data = await response.json();
                window.location.href = '/Home'; // เปลี่ยนเส้นทางไปยังหน้า Home
            } else {
                const errorData = await response.json();
                // Show modal with error message
                setModalMessage('Username or password is incorrect. Please try again.');
                setShowModal(true);
            }
        } catch (error) {
            console.error('Error during login:', error);
            alert('Something went wrong. Please try again later.');
        }
    };

    // Modal to show error message
    const closeModal = () => {
        setShowModal(false);
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

            {/* Modal Popup */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <p>{modalMessage}</p>
                        <button onClick={closeModal}>OK</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
