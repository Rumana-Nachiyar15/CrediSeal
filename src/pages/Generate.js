import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function Generate() {
  const { courseId } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    qualification: 'Student',
    course_id: '',
    course_pursuing: '',
    domain: '',
    job_role: ''
  });

  useEffect(() => {
    if (courseId) {
      setFormData(prev => ({ ...prev, course_id: courseId }));
    }
  }, [courseId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      email: formData.email,
      qualification: formData.qualification,
      course_id: formData.course_id,
    };

    if (formData.qualification === "Student") {
      payload.course_pursuing = formData.course_pursuing;
    } else {
      payload.domain = formData.domain;
      payload.job_role = formData.job_role;
    }

    try {
      const res = await fetch('http://localhost:5000/generate-certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (res.ok) {
        alert(result.message || "Certificate sent successfully!");
        window.open(result.url, '_blank');
      } else {
        alert(result.error || "Something went wrong.");
      }
    } catch (err) {
      alert("Failed to generate certificate: " + err.message);
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Generate Your Certificate</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <select
          name="qualification"
          value={formData.qualification}
          onChange={handleChange}
          required
        >
          <option value="Student">Student</option>
          <option value="Employee">Employee</option>
        </select>

        {formData.qualification === 'Student' ? (
          <input
            type="text"
            name="course_pursuing"
            placeholder="Course Pursuing"
            value={formData.course_pursuing}
            onChange={handleChange}
            required
          />
        ) : (
          <>
            <input
              type="text"
              name="domain"
              placeholder="Domain (e.g., AI, ML)"
              value={formData.domain}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="job_role"
              placeholder="Job Role"
              value={formData.job_role}
              onChange={handleChange}
              required
            />
          </>
        )}

        <button type="submit">Generate Certificate</button>
      </form>
    </div>
  );
}
