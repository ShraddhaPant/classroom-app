import React from "react";
import { useNavigate } from "react-router-dom";
import "./FruntTot.css";

const FruntTot = () => {
  const navigate = useNavigate();

  const handleRoleClick = (role) => {
    // Store the role temporarily for Logs.jsx to use after login
    localStorage.setItem("preLoginRole", role);
    navigate("/logs", { state: { role } });
  };

  return (
    <div className="frunt-container">
      <div className="frunt-content">
        <h2 className="welcome-text">
          Welcome! Join our community <br />
          of Educators and Learners
        </h2>

        {/* Teacher button */}
        <button
          className="teacher-btn"
          onClick={() => handleRoleClick("teacher")}
        >
          Join as a Teacher
        </button>

        {/* Student button */}
        <button
          className="student-btn"
          onClick={() => handleRoleClick("student")}
        >
          Join as a Student
        </button>
      </div>
    </div>
  );
};

export default FruntTot;
