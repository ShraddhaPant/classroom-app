// src/pages/Tea.jsx
import React, { useEffect, useState } from "react";
import { db } from "./firebaseConfig";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore"; // ✅ added deleteDoc, doc
import { useNavigate } from "react-router-dom";
import "./Tea.css";

const Tea = () => {
  const [classrooms, setClassrooms] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "classrooms"));
        const list = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClassrooms(list);
      } catch (error) {
        console.error("Error fetching classrooms:", error);
      }
    };
    fetchClassrooms();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this classroom?")) {
      try {
        await deleteDoc(doc(db, "classrooms", id));
        setClassrooms(classrooms.filter((cls) => cls.id !== id)); // update UI
      } catch (error) {
        console.error("Error deleting classroom:", error);
      }
    }
  };

  return (
    <div className="tea-container">
      <h2 className="tea-heading">Choose Your Classroom</h2>

      <div className="classroom-grid">
        {classrooms.length > 0 ? (
          classrooms.map((cls) => (
            <div key={cls.id} className="class-card">
              <div className="class-info" onClick={() => navigate(`/view/${cls.id}`)}>
                <h3 className="class-subject">{cls.subject}</h3>
                <p><strong>Professor:</strong> {cls.professorName}</p>
                <p><strong>College:</strong> {cls.collegeName}</p>
                <p><strong>Degree:</strong> {cls.degree}</p>
                <p><strong>Semester:</strong> {cls.semester}</p>
              </div>
              <div className="delete-icon" onClick={() => handleDelete(cls.id)}>
                🗑️
              </div>
            </div>
          ))
        ) : (
          <p className="no-classes">No classrooms yet. Create one below.</p>
        )}
      </div>

      <div className="btn-container">
        <button
          className="create-btn"
          onClick={() => navigate("/general-info")}
        >
          + Create New Classroom
        </button>
      </div>
    </div>
  );
};

export default Tea;
