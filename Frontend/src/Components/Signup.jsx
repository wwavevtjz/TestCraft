import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CSS/Login.css';
import logo from '../image/testcraft-logo.png';

const Signup = () => {
    const [formData, setFormData] = useState({
        email: '',
        fullName: '',
        password: '',
        agreeToTerms: false,
    });

    const navigate = useNavigate(); // ใช้ useNavigate สำหรับเปลี่ยนเส้นทาง

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.agreeToTerms) {
            alert('You must agree to the Terms & Conditions to sign up.');
            return;
        }

        try {
            const response = await fetch('http://localhost:3001/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_name: formData.fullName,
                    user_password: formData.password,
                }),
            });

            if (response.ok) {
                alert('Sign Up Successful!');
                navigate('/'); // เปลี่ยนเส้นทางไปหน้า Login
            } else {
                const errorData = await response.json();
                alert('Sign Up Failed: ' + errorData.message);
            }
        } catch (error) {
            console.error('Error signing up:', error);
            alert('Something went wrong. Please try again later.');
        }
    };

    return (
        <div className="login-page">
            <div className="login-left">
                <img src={logo} alt="TestCraft Logo" className="promo-image" />
            </div>
            <div className="login-right">
                <form className="login-form" onSubmit={handleSubmit}>
                    <h1>Sign Up</h1>
                    <p>
                        Already have an account? <a href="/">Log In</a>
                    </p>
                    <div className="form-group">
                        <label htmlFor="Username">User Name</label>
                        <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Enter your full name"
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
                    <div className="form-options">
                        <label>
                            <input
                                type="checkbox"
                                name="agreeToTerms"
                                checked={formData.agreeToTerms}
                                onChange={handleChange}
                            />
                            I agree to the Terms & Conditions
                        </label>
                    </div>
                    <button type="submit" className="login-button">
                        Sign Up
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Signup;
