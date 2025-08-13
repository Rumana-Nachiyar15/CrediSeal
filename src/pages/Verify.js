import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Verify.css';

export default function Verify() {
  const [certId, setCertId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!certId.trim()) {
      setError('Please enter a Certificate ID');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/verify/${certId}`);
      if (!res.ok) {
        throw new Error('Certificate not found');
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Verification failed');
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

        {error && <div className="error-msg">❌ {error}</div>}

        {result && result.valid && (
          <div className="verify-result">
            <div className="certificate-card">
              <h3>✅ Certificate is Valid</h3>
              <p><strong>Course:</strong> {result.course}</p>
              <p><strong>Date:</strong> {result.date}</p>
              {/* Embedded PDF in small box */}
              <div className="pdf-viewer-container">
                <iframe
                  src={result.pdf_url}
                  title="Certificate PDF"
                  width="400px"
                  height="300px"
                  style={{ border: '1px solid #ccc', borderRadius: '8px' }}
                />
              </div>
              <a href={result.pdf_url} download className="download-link">
                📄 Download Certificate
              </a>
            </div>
          </div>
        )}

        {result && !result.valid && (
          <div className="error-msg">❌ {result.message || 'Invalid Certificate ID'}</div>
        )}
      </div>
    </div>
  );
}

