import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './OrgSetup.css';

export default function OrgSetup() {
  const [formData, setFormData] = useState({
    course: '',
    institution: '',
    duration: '',
    signer: '',
    logo: null
  });

  const [generatedLink, setGeneratedLink] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleBackHome = () => {
    navigate('/');
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    for (let key in formData) data.append(key, formData[key]);

    const res = await fetch('http://localhost:5000/create-course', {
      method: 'POST',
      body: data
    });

    const result = await res.json();
    const link = `http://localhost:3000/course/${result.course_id}`;
    setGeneratedLink(link);
    setCopied(false);
    setShowPopup(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setGeneratedLink('');
    setCopied(false);
  };

  return (
    <>
      {/* Main container with conditional blur */}
      <div className={`org-setup-container ${showPopup ? 'blurred-background' : ''}`}>
        <span className="text-logo">CrediSeal</span>
        <button className="back-arrow" onClick={handleBackHome}>←</button>

        <div className="org-content">
          <h2 className="org-heading">Certificate In Flow</h2>
          <form className="org-form" onSubmit={handleSubmit}>
            <input type="text" name="course" placeholder="Course Name" onChange={handleChange} required />
            <input type="text" name="institution" placeholder="Institution Name" onChange={handleChange} required />
            <input type="text" name="duration" placeholder="Duration (e.g. 40 Hours)" onChange={handleChange} required />
            <input type="text" name="signer" placeholder="Authorized Signer" onChange={handleChange} required />
            <input type="file" name="logo" accept="image/*" onChange={handleChange} required />
            <button type="submit" className="submit-button">Create & Share Link</button>
          </form>
        </div>
      </div>

      {/* Popup outside the blurred container */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-card">
            <button className="popup-close" onClick={closePopup}>✖</button>
            <h3>Certificate Link Ready!</h3>
            <div className="popup-link-box">
              <span>{generatedLink}</span>
              <button onClick={handleCopy} className="copy-btn">📋</button>
            </div>
            {copied && <p className="copied-msg">✔ Link copied to clipboard</p>}
          </div>
        </div>
      )}
    </>
  );
}
