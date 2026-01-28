import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { auth, db } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Home, BookOpen, Users, Plus, Trash2 } from "lucide-react";
import "./Classroom.css";

export default function Classroom() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [students, setStudents] = useState([]);
  const [admin, setAdmin] = useState(null);

  const [showAdminForm, setShowAdminForm] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);

  const [adminName, setAdminName] = useState("");
  const [studentName, setStudentName] = useState("");
  const [enrollNo, setEnrollNo] = useState("");

  /* ===== AUTH ===== */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/logs");
        return;
      }
      setUser(currentUser);

      const q = query(collection(db, "users"));
      const snapshot = await getDocs(q);
      snapshot.forEach((docu) => {
        if (docu.data().email === currentUser.email) {
          setUserRole(docu.data().role);
        }
      });
    });
    return () => unsubscribe();
  }, [navigate]);

  /* ===== FETCH CLASSROOM ===== */
  useEffect(() => {
    const q = query(collection(db, "classroom"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docu) => ({
        id: docu.id,
        ...docu.data(),
      }));
      setAdmin(data.find((d) => d.role === "teacher"));
      setStudents(data.filter((d) => d.role === "student"));
    });
    return () => unsubscribe();
  }, []);

  /* ===== DELETE MEMBER ===== */
  const deleteMember = async (id) => {
    await deleteDoc(doc(db, "classroom", id));
  };

  /* ===== ADD ADMIN ===== */
  const addAdmin = async () => {
    if (!adminName) return alert("Enter admin name");

    await addDoc(collection(db, "classroom"), {
      name: adminName,
      role: "teacher",
      avatar: "https://cdn-icons-png.flaticon.com/512/3069/3069172.png",
    });

    setAdminName("");
    setShowAdminForm(false);
  };

  /* ===== ADD STUDENT ===== */
  const addStudent = async () => {
    if (!studentName || !enrollNo)
      return alert("Enter name and enrollment number");

    await addDoc(collection(db, "classroom"), {
      name: studentName,
      enrollNo,
      role: "student",
      avatar: "https://cdn-icons-png.flaticon.com/512/809/809052.png",
    });

    setStudentName("");
    setEnrollNo("");
    setShowStudentForm(false);
  };

  return (
    <div className="classroom-page">
      {/* ===== HEADER ===== */}
      <header className="classroom-header">
        <h2 className="classroom-title">Classroom</h2>
        <hr className="classroom-line" />
      </header>

      {/* ===== TABS ===== */}
      <div className="classroom-tabs">
        <span className="active">Classroom</span>
        <span onClick={() => navigate("/attendance")}>Attendance</span>
      </div>
      <hr className="tabs-line" />

      {/* ===== MAIN ===== */}
      <main className="classroom-main">
        {/* ===== ADMIN ===== */}
        <div className="section">
          <h4 className="section-title">Admin</h4>

          {admin ? (
            <div className="member-card">
              <img src={admin.avatar} alt="Admin" className="profile-img" />
              <div className="member-info">
                <p className="member-name">{admin.name}</p>
                <p className="member-role">Professor</p>
              </div>

              <Trash2
                size={18}
                className="delete-icon"
                onClick={() => deleteMember(admin.id)}
              />
            </div>
          ) : (
            <p>No admin data available.</p>
          )}

          <button className="add-member-btn" onClick={() => setShowAdminForm(true)}>
            <Plus size={16} /> Add Admin
          </button>
        </div>

        {/* ===== STUDENTS ===== */}
        <div className="section">
          <h4 className="section-title">Students</h4>

          {students.length === 0 ? (
            <p>No students enrolled yet.</p>
          ) : (
            students.map((student, index) => (
              <div key={index} className="member-card">
                <img
                  src={student.avatar}
                  alt={student.name}
                  className="profile-img"
                />
                <div className="member-info">
                  <p className="member-name">{student.name}</p>
                  <p className="member-role">
                    Student {student.enrollNo && `• ${student.enrollNo}`}
                  </p>
                </div>

                <Trash2
                  size={18}
                  className="delete-icon"
                  onClick={() => deleteMember(student.id)}
                />
              </div>
            ))
          )}

          <button
            className="add-member-btn"
            onClick={() => setShowStudentForm(true)}
          >
            <Plus size={16} /> Add Student
          </button>
        </div>
      </main>

      {/* ===== BOTTOM NAV ===== */}
      <footer className="classroom-bottom-nav">
        <div onClick={() => navigate("/viewpage")}>
          <Home size={20} />
          <span>Dashboard</span>
        </div>
        <div onClick={() => navigate("/assignment")}>
          <BookOpen size={20} />
          <span>Assignment</span>
        </div>
        <div className="active-nav">
          <Users size={20} />
          <span>Classroom</span>
        </div>
      </footer>

      {/* ===== ADMIN FORM ===== */}
      {showAdminForm && (
        <div className="overlay">
          <div className="popup">
            <h3>Add Admin</h3>
            <input
              type="text"
              placeholder="Admin Name"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
            />
            <button onClick={addAdmin}>Save</button>
            <button onClick={() => setShowAdminForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ===== STUDENT FORM ===== */}
      {showStudentForm && (
        <div className="overlay">
          <div className="popup">
            <h3>Add Student</h3>
            <input
              type="text"
              placeholder="Student Name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Enrollment Number"
              value={enrollNo}
              onChange={(e) => setEnrollNo(e.target.value)}
            />
            <button onClick={addStudent}>Save</button>
            <button onClick={() => setShowStudentForm(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
