import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css'; // Link to the external CSS

export default function Home() {
  return (
    <div className="home-container">
      <div className="branding">
       <h1 className="company-name">CrediSeal</h1>
<h2 className="theme-text">Secure. Certify. Verify.</h2>

      </div>

      <div className="links">
        <Link to="/org-setup" className="home-button">Make Your Certificate</Link>
        <Link to="/verify" className="home-button">Verify the Originality</Link>
      </div>
    </div>
  );
}
