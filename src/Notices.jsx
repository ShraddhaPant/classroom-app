import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Home, BookOpen, Users, Trash2 } from "lucide-react";
import "./Notices.css";

export default function Notices() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notices, setNotices] = useState([]);

  // ===== Fetch current user & role =====
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/logs");
        return;
      }
      setUser(currentUser);

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserRole(userSnap.data().role);
        } else {
          setUserRole("student");
        }
      } catch (err) {
        console.error("Error fetching role:", err);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // ===== Fetch notices =====
  const fetchNotices = async () => {
    try {
      const q = query(collection(db, "notices"), orderBy("timestamp", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setNotices(data);
    } catch (err) {
      console.error("Error fetching notices:", err);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  // ===== Upload notice =====
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a title!");
      return;
    }

    try {
      await addDoc(collection(db, "notices"), {
        title: title.trim(),
        description: description.trim(),
        timestamp: serverTimestamp(),
        createdBy: user?.email || "unknown",
      });

      setTitle("");
      setDescription("");
      setShowAddForm(false);
      fetchNotices();
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to add notice");
    }
  };

  // ===== Delete notice =====
  const handleDeleteNotice = async (id) => {
    if (!window.confirm("Delete this notice?")) return;

    try {
      await deleteDoc(doc(db, "notices", id));
      fetchNotices();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete notice");
    }
  };

  return (
    <div className="notices-page">

      {/* ===== HEADER ===== */}
      <header className="notices-topbar">
        <h2 className="top-title">Dashboard</h2>
        <hr className="big-line" />
      </header>

      {/* ===== TABS ===== */}
      <div className="notices-tabs">
        <span onClick={() => navigate("/viewpage")}>Recent</span>
        <span onClick={() => navigate("/notes")}>Notes</span>
        <span onClick={() => navigate("/links")}>Links</span>
        <span className="active">Notices</span>
      </div>

      <hr className="tabs-line" />

      {/* ===== MAIN CONTENT ===== */}
      <main className="notices-main">

        <h3 className="notices-section-title">Notice</h3>

        {userRole === "teacher" && !showAddForm && (
          <button
            className="add-notice-btn"
            onClick={() => setShowAddForm(true)}
          >
            +
          </button>
        )}

        {showAddForm && (
          <div className="addnotice-form">

            <div className="form-header">
              <h3>Add Notice</h3>
              <button
                className="close-btn"
                onClick={() => setShowAddForm(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpload}>
              <input
                className="input"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <textarea
                className="input"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <button className="upload-btn" type="submit">
                Upload
              </button>
            </form>

          </div>
        )}

        {!showAddForm && (
          <div className="notices-list">
            {notices.length === 0 ? (
              <p>No notices yet.</p>
            ) : (
              notices.map((notice) => (
                <div className="notice-card" key={notice.id}>

                  <div className="notice-header">
                    <h4>{notice.title}</h4>

                    {userRole === "teacher" && (
                      <Trash2
                        size={16}
                        className="delete-icon"
                        onClick={() => handleDeleteNotice(notice.id)}
                      />
                    )}
                  </div>

                  {notice.description && <p>{notice.description}</p>}

                  {notice.createdBy && (
                    <small>Posted by {notice.createdBy}</small>
                  )}

                </div>
              ))
            )}
          </div>
        )}

      </main>

      {/* ===== BOTTOM NAV ===== */}
      <footer className="notices-bottom-nav">
        <div onClick={() => navigate("/viewpage")}>
          <Home size={20} />
          <span>Dashboard</span>
        </div>

        <div onClick={() => navigate("/assignment")}>
          <BookOpen size={20} />
          <span>Assignment</span>
        </div>

        <div onClick={() => navigate("/classroom")}>
          <Users size={20} />
          <span>Classroom</span>
        </div>
      </footer>

    </div>
  );
}
