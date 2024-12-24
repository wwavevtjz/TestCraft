import React from 'react';
import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './CSS/Home.css';
import logo from '../image/testcraft-logo.png';


const Home = () => {
  return (
    <div className="testcraft-home">
      <div className="promo-banner">
        <img src={logo} alt="TestCraft Logo" className="promo-image" />
        <div className="promo-content">
          <h2>Welcome to TestCraft</h2>
          <p>Your all-in-one project management and testing tool, ISO/IEC 29110 compliant.</p>
          <p>
            Streamline project, requirement, design, and test case management
            with seamless traceability and collaboration.
          </p>
          <p>
            Experience the future of project management and testing today!
            Start your free trial now and elevate your workflow with TestCraft.
          </p>
        </div>
        <div className='try-now'>
          <Link to="/Project">
            <Button className="button-try">Try Now</Button>
          </Link>
        </div>
      </div>
    </div>

  );
}

export default Home;
