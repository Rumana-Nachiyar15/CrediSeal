import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './CertificateSent.css';

export default function CertificateSent() {
  const { state } = useLocation();
  const navigate = useNavigate();

  return (
    <div className="certificate-sent-container">
      <div className="card">
        <h2>🎉 Certificate Sent!</h2>
        <p>
          Dear <strong>{state?.name}</strong>,<br />
          Your certificate has been successfully sent to <strong>{state?.email}</strong>.
        </p>

        <div className="branding-box">
          <h3 className="logo-text">CrediSeal</h3>
          <p className="tagline">Secure. Certify. Verify.</p>
          <p className="description">
            CrediSeal helps institutions and learners ensure authentic certification with
            verifiable digital credentials delivered seamlessly via email.
          </p>
        </div>

        <button onClick={() => navigate('/')} className="home-button">Explore CrediSeal</button>
      </div>
    </div>
  );
}
