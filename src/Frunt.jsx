import React from "react";
import "./Frunt.css";
import { useNavigate } from "react-router-dom";

function Frunt() {
  const navigate = useNavigate();

  return (
    <div className="front-page">
      {/* Hive Background */}
      <div className="hive-background">
        {Array.from({ length: 500 }).map((_, i) => (
          <div key={i} className="hex"></div>
        ))}
      </div>

      {/* Foreground Content */}
      <div className="frunt-content">
        <h1 className="title">Class Hive</h1>
        <button className="continue-btn" onClick={() => navigate("/frunttot")}>
          Continue
        </button>
      </div>
    </div>
  );
}

export default Frunt;
