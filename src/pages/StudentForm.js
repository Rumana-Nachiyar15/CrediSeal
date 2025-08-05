import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './StudentForm.css';

export default function StudentForm() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [qualification, setQualification] = useState('');
  const [formData, setFormData] = useState({
    name: '', email: '', qualification: '',
    course_pursuing: '', domain: '', job_role: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'qualification') setQualification(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, course_id: courseId };

    const res = await fetch('http://localhost:5000/generate-certificate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (res.ok) {
      navigate('/certificate-sent', {
        state: { email: formData.email, name: formData.name }
      });
    } else {
      alert('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="student-form-container">
      <h2 className="form-heading">Claim Your Certificate</h2>
      <form onSubmit={handleSubmit} className="student-form">
        <input name="name" placeholder="Your Name" onChange={handleChange} required />
        <input name="email" type="email" placeholder="Your Email" onChange={handleChange} required />

        <select name="qualification" onChange={handleChange} required>
          <option value="">Select Qualification</option>
          <option value="Student">Student</option>
          <option value="Employee">Employee</option>
        </select>

        {qualification === 'Student' && (
          <input name="course_pursuing" placeholder="Course You're Pursuing" onChange={handleChange} required />
        )}
        {qualification === 'Employee' && (
          <>
            <input name="domain" placeholder="Domain (e.g., AI, Cloud)" onChange={handleChange} required />
            <input name="job_role" placeholder="Job Role (e.g., Developer)" onChange={handleChange} required />
          </>
        )}

        <button type="submit" className="submit-button">Generate Certificate</button>
      </form>
    </div>
  );
}
