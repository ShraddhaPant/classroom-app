// src/pages/GeneralInfo.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./GeneralInfo.css";

const GeneralInfo = () => {
  const [formData, setFormData] = useState({
    subject: "",
    professorName: "",
    collegeName: "",
    degree: "",
    semester: ""
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Simple validation
    if (!formData.subject || !formData.professorName || !formData.collegeName || !formData.degree || !formData.semester) {
      alert("Please fill in all fields!");
      return;
    }

    // Navigate to CodeCreate page with classroom info
    navigate("/code-create", { state: formData });
  };

  return (
    <div className="general-container">
      <div className="general-card">
        <h2>Create New Classroom</h2>

        <form onSubmit={handleSubmit} className="general-form">
          <input
            name="subject"
            placeholder="Subject"
            value={formData.subject}
            onChange={handleChange}
            required
          />
          <input
            name="professorName"
            placeholder="Professor Name"
            value={formData.professorName}
            onChange={handleChange}
            required
          />
          <input
            name="collegeName"
            placeholder="College Name"
            value={formData.collegeName}
            onChange={handleChange}
            required
          />
          <input
            name="degree"
            placeholder="Degree"
            value={formData.degree}
            onChange={handleChange}
            required
          />
          <input
            name="semester"
            placeholder="Semester"
            value={formData.semester}
            onChange={handleChange}
            required
          />

          <button type="submit" className="submit-btn">
            Next ➝ Generate Code
          </button>
        </form>
      </div>
    </div>
  );
};

export default GeneralInfo;
