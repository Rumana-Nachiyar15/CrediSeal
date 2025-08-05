import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Verify.css';

export default function Verify() {
  const [certId, setCertId] = useState('');
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/verify/${certId}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Verification error:', err);
      setResult({ valid: false, message: 'Network error' });
    }
  };

  return (
    <div className="verify-container">
      <button className="back-button" onClick={() => navigate('/')}>←</button>
      <span className="logo-text">CrediSeal</span>

      <div className="verify-box">
        <h2 className="verify-heading">Verify Certificate</h2>
        <form onSubmit={handleVerify} className="verify-form">
          <input
            type="text"
            placeholder="Enter Certificate ID"
            value={certId}
            onChange={(e) => setCertId(e.target.value)}
            required
          />
          <button type="submit">Verify</button>
        </form>

        {result && (
          <div className="verify-result">
            {result.valid ? (
              <div className="certificate-card">
                <h3>✅ Certificate is Valid</h3>
                <p><strong>Name:</strong> {result.name}</p>
                <p><strong>Course:</strong> {result.course}</p>
                <p><strong>Date:</strong> {result.date}</p>
                <p><strong>Email:</strong> {result.email}</p>
                {result.pdf_url && (
                  <p>
                    <a href={result.pdf_url} target="_blank" rel="noopener noreferrer">
                      📄 View Certificate
                    </a>
                  </p>
                )}
              </div>
            ) : (
              <div className="error-msg">❌ {result.message || 'Invalid Certificate ID'}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
